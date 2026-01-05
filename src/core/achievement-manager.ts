import { Achievement, AchievementProgress, AchievementStats } from '../types/achievement';
import { Database } from '../database/schema';
import { BadgeUnlocker } from './badge-unlocker';

export class AchievementManager {
  private db: Database;
  private badgeUnlocker: BadgeUnlocker;

  constructor(db: Database, badgeUnlocker: BadgeUnlocker) {
    this.db = db;
    this.badgeUnlocker = badgeUnlocker;
  }

  /**
   * Define all available achievements
   */
  getAchievementDefinitions(): Achievement[] {
    return [
      // Competitive Programming
      {
        id: 'badge_001_beginner_solver',
        name: 'Beginner Solver',
        description: 'Solved 50 LeetCode problems across all difficulties',
        category: 'COMPETITIVE_PROGRAMMING',
        xpReward: 500,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_002_problem_master',
        name: 'Problem Master',
        description: 'Solved 250 LeetCode problems',
        category: 'COMPETITIVE_PROGRAMMING',
        xpReward: 2000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_003_algorithm_wizard',
        name: 'Algorithm Wizard',
        description: 'Solved 500 LeetCode problems',
        category: 'COMPETITIVE_PROGRAMMING',
        xpReward: 5000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_004_hard_specialist',
        name: 'Hard Specialist',
        description: 'Solved 100 Hard-level problems',
        category: 'COMPETITIVE_PROGRAMMING',
        xpReward: 3000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_005_codeforces_contender',
        name: 'Codeforces Contender',
        description: 'Participated in 20 Codeforces contests',
        category: 'COMPETITIVE_PROGRAMMING',
        xpReward: 1500,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Project & Shipping
      {
        id: 'badge_006_first_ship',
        name: 'First Ship',
        description: 'Deploy 1 project to production',
        category: 'PROJECT',
        xpReward: 1500,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_007_prolific_builder',
        name: 'Prolific Builder',
        description: 'Deploy 5+ projects to production',
        category: 'PROJECT',
        xpReward: 5000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Collaboration
      {
        id: 'badge_008_code_reviewer',
        name: 'Code Reviewer',
        description: 'Reviewed 50 pull requests',
        category: 'PROJECT',
        xpReward: 1500,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_009_open_source_hero',
        name: 'Open Source Hero',
        description: '50+ merged contributions to open-source',
        category: 'PROJECT',
        xpReward: 5000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Streaks
      {
        id: 'badge_010_consistent_grinder',
        name: 'Consistent Grinder',
        description: '30-day coding streak',
        category: 'MILESTONE',
        xpReward: 1000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'badge_011_marathon_runner',
        name: 'Marathon Runner',
        description: '100-day coding streak',
        category: 'MILESTONE',
        xpReward: 3000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Learning
      {
        id: 'badge_012_technical_writer',
        name: 'Technical Writer',
        description: '1 technical blog post (1K+ words)',
        category: 'LEARNING',
        xpReward: 2000,
        unlocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  /**
   * Check if achievement should be unlocked and unlock it
   */
  async checkAndUnlockAchievement(
    userId: string,
    achievementId: string,
    userData: Record<string, any>
  ): Promise<{ unlocked: boolean; xpAwarded: number }> {
    const achievement = this.getAchievementDefinitions().find((a) => a.id === achievementId);

    if (!achievement) {
      throw new Error(`Achievement not found: ${achievementId}`);
    }

    const progress = await this.getAchievementProgress(userId, achievementId);

    if (progress.unlocked) {
      return { unlocked: false, xpAwarded: 0 };
    }

    // Determine if conditions are met
    const conditionsMet = this.checkUnlockConditions(achievementId, userData);

    if (!conditionsMet) {
      return { unlocked: false, xpAwarded: 0 };
    }

    // Unlock achievement
    await this.db.achievements.update({ userId, achievementId }, {
      unlocked: true,
      unlockedAt: new Date(),
      unlockedBy: userId,
      updatedAt: new Date(),
    });

    // Award XP through badge unlocker
    const xpResult = await this.badgeUnlocker.awardBadgeXP(userId, achievementId, achievement.xpReward);

    return { unlocked: true, xpAwarded: xpResult.xpAdded };
  }

  /**
   * Check unlock conditions for specific achievement
   */
  private checkUnlockConditions(achievementId: string, userData: Record<string, any>): boolean {
    const conditions: Record<string, boolean> = {
      badge_001_beginner_solver: userData.leetcodeProblems >= 50,
      badge_002_problem_master: userData.leetcodeProblems >= 250,
      badge_003_algorithm_wizard: userData.leetcodeProblems >= 500,
      badge_004_hard_specialist: userData.leetcodeHardProblems >= 100,
      badge_005_codeforces_contender: userData.codeforcesContests >= 20,
      badge_006_first_ship: userData.projectsDeployed >= 1,
      badge_007_prolific_builder: userData.projectsDeployed >= 5,
      badge_008_code_reviewer: userData.prReviewed >= 50,
      badge_009_open_source_hero: userData.opensourceContribs >= 50,
      badge_010_consistent_grinder: userData.codingStreak >= 30,
      badge_011_marathon_runner: userData.codingStreak >= 100,
      badge_012_technical_writer: userData.blogPosts >= 1,
    };

    return conditions[achievementId] || false;
  }

  /**
   * Get achievement progress for user
   */
  async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<AchievementProgress> {
    const entry = await this.db.achievements.findOne({ userId, achievementId });

    if (!entry) {
      return {
        userId,
        achievementId,
        progress: 0,
        currentValue: 0,
        targetValue: 0,
        unlocked: false,
        lastUpdated: new Date(),
      };
    }

    return entry;
  }

  /**
   * Get achievement statistics for user
   */
  async getAchievementStats(userId: string): Promise<AchievementStats> {
    const achievements = await this.db.achievements.find({ userId, unlocked: true }).exec();
    const total = this.getAchievementDefinitions().length;

    const rarity = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    // Count by rarity
    for (const achievement of achievements) {
      if (achievement.xpReward < 1000) rarity.common++;
      else if (achievement.xpReward < 3000) rarity.rare++;
      else if (achievement.xpReward < 10000) rarity.epic++;
      else rarity.legendary++;
    }

    return {
      totalAchievements: total,
      unlockedAchievements: achievements.length,
      completionPercentage: (achievements.length / total) * 100,
      rareUnlocks: rarity.rare,
      epicUnlocks: rarity.epic,
      legendaryUnlocks: rarity.legendary,
    };
  }
}