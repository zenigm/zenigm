import { UserXPProfile, XPTransaction, LEVEL_THRESHOLDS } from '../types/xp';
import { Database } from '../database/schema';

export class XPCalculator {
  private db: Database;
  private readonly XP_SOURCES = {
    CODE_COMMIT: 10,
    PR_MERGED: 50,
    ISSUE_RESOLVED: 35,
    LEETCODE_EASY: 15,
    LEETCODE_MEDIUM: 35,
    LEETCODE_HARD: 75,
    CODEFORCES_CONTEST: 50,
    SYSTEM_DESIGN_DOC: 100,
    TECHNICAL_BLOG: 150,
    OPEN_SOURCE_CONTRIB: 200,
    HACKATHON: 300,
    MENTORING_HOUR: 25,
    PROJECT_SHIPPED: 500,
  };

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Calculate XP for activity and add transaction
   */
  async addXP(
    userId: string,
    sourceType: keyof typeof this.XP_SOURCES,
    metadata: Record<string, any> = {}
  ): Promise<{ xpAdded: number; newTotal: number; leveledUp: boolean; newLevel?: number }> {
    const xpAmount = this.XP_SOURCES[sourceType];
    
    // Check daily cap for GitHub commits
    if (sourceType === 'CODE_COMMIT') {
      const dailyTotal = await this.getDailyXP(userId, 'CODE_COMMIT');
      if (dailyTotal >= 100) {
        throw new Error('Daily cap for CODE_COMMIT reached (100 XP)');
      }
    }

    // Create transaction
    const transaction: XPTransaction = {
      id: `xp_${Date.now()}_${userId}`,
      userId,
      sourceType,
      xpAmount,
      timestamp: new Date(),
      verified: false,
      metadata,
    };

    // Save to database
    await this.db.xpTransactions.insert(transaction);

    // Get current profile
    const profile = await this.getUserProfile(userId);
    const previousLevel = profile.currentLevel;
    const newTotal = profile.totalXP + xpAmount;

    // Update profile
    const newLevel = this.calculateLevel(newTotal);
    const leveledUp = newLevel > previousLevel;

    await this.db.userProfiles.update({ userId }, {
      totalXP: newTotal,
      currentLevel: newLevel,
      levelProgress: this.calculateLevelProgress(newTotal),
      updatedAt: new Date(),
    });

    return {
      xpAdded: xpAmount,
      newTotal,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }

  /**
   * Calculate current level from total XP
   */
  calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 100000) + 1;
  }

  /**
   * Calculate progress towards next level (0-100%)
   */
  calculateLevelProgress(totalXP: number): number {
    const currentLevel = this.calculateLevel(totalXP);
    const minXP = (currentLevel - 1) * 100000;
    const maxXP = currentLevel * 100000;
    return ((totalXP - minXP) / (maxXP - minXP)) * 100;
  }

  /**
   * Get level information
   */
  getLevelInfo(level: number) {
    return LEVEL_THRESHOLDS[Math.min(level, 10)] || LEVEL_THRESHOLDS[10];
  }

  /**
   * Get user's daily XP for specific source
   */
  private async getDailyXP(userId: string, sourceType: string): Promise<number> {
    const today = new Date().toDateString();
    const transactions = await this.db.xpTransactions.find({
      userId,
      sourceType,
      timestamp: {
        $gte: new Date(today),
      },
    }).exec();

    return transactions.reduce((sum: number, t: XPTransaction) => sum + t.xpAmount, 0);
  }

  /**
   * Get user XP profile
   */
  async getUserProfile(userId: string): Promise<UserXPProfile> {
    let profile = await this.db.userProfiles.findOne({ userId });

    if (!profile) {
      profile = {
        userId,
        totalXP: 0,
        currentLevel: 1,
        levelProgress: 0,
        nextLevelThreshold: 100000,
        xpHistory: [],
        badges: [],
        achievements: [],
      };
      await this.db.userProfiles.insert(profile);
    }

    return profile;
  }

  /**
   * Get XP breakdown by source
   */
  async getXPBreakdown(userId: string) {
    const transactions = await this.db.xpTransactions.find({ userId }).exec();
    const breakdown: Record<string, { count: number; total: number }> = {};

    for (const tx of transactions) {
      if (!breakdown[tx.sourceType]) {
        breakdown[tx.sourceType] = { count: 0, total: 0 };
      }
      breakdown[tx.sourceType].count++;
      breakdown[tx.sourceType].total += tx.xpAmount;
    }

    return breakdown;
  }
}