import { LeaderboardEntry, LeaderboardStats, UserLeaderboardPosition } from '../types/leaderboard';
import { Database } from '../database/schema';

export class LeaderboardManager {
  private db: Database;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Get global leaderboard
   */
  async getLeaderboard(
    limit: number = 100,
    offset: number = 0,
    period: 'ALL_TIME' | 'SEASONAL' | 'MONTHLY' | 'WEEKLY' = 'ALL_TIME'
  ): Promise<LeaderboardStats> {
    try {
      // Check cache first
      const cached = await this.getFromCache(`leaderboard:${period}`);
      if (cached && Date.now() - cached.generatedAt.getTime() < this.CACHE_TTL * 1000) {
        return cached;
      }

      // Fetch from database, sorted by XP (descending)
      const profiles = await this.db.userProfiles
        .find({})
        .sort({ totalXP: -1 })
        .limit(limit)
        .skip(offset)
        .exec();

      const entries: LeaderboardEntry[] = profiles.map((profile, index) => ({
        rank: offset + index + 1,
        userId: profile.userId,
        username: profile.userId, // Get from user service
        totalXP: profile.totalXP,
        currentLevel: profile.currentLevel,
        badges: profile.badges?.length || 0,
        achievements: profile.achievements?.length || 0,
        lastActive: profile.updatedAt,
      }));

      const total = await this.db.userProfiles.count({});

      const stats: LeaderboardStats = {
        period,
        entries,
        totalPlayers: total,
        generatedAt: new Date(),
      };

      // Cache result
      await this.setCache(`leaderboard:${period}`, stats);

      return stats;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard data');
    }
  }

  /**
   * Get user's leaderboard position
   */
  async getUserPosition(userId: string): Promise<UserLeaderboardPosition> {
    try {
      const userProfile = await this.db.userProfiles.findOne({ userId });

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Count how many players have more XP
      const rankAbove = await this.db.userProfiles.count({
        totalXP: { $gt: userProfile.totalXP },
      });

      const currentRank = rankAbove + 1;

      // Get total players for percentile
      const totalPlayers = await this.db.userProfiles.count({});

      // Get XP difference to next rank - fix the sort calls
      const nextRankedProfile = await this.db.userProfiles
        .find({ totalXP: { $lt: userProfile.totalXP } })
        .sort({ totalXP: -1 })
        .limit(1)
        .exec()
        .then(profiles => profiles[0] || null);

      const previousRankedProfile = await this.db.userProfiles
        .find({ totalXP: { $gt: userProfile.totalXP } })
        .sort({ totalXP: 1 })
        .limit(1)
        .exec()
        .then(profiles => profiles[0] || null);

      return {
        userId,
        currentRank,
        percentile: ((totalPlayers - currentRank) / totalPlayers) * 100,
        xpAhead: previousRankedProfile
          ? previousRankedProfile.totalXP - userProfile.totalXP
          : 0,
        xpBehind: nextRankedProfile
          ? userProfile.totalXP - nextRankedProfile.totalXP
          : 0,
      };
    } catch (error) {
      console.error('Error fetching user position:', error);
      throw new Error('Failed to fetch user position');
    }
  }

  /**
   * Get category-specific leaderboard (e.g., LeetCode problems)
   */
  async getCategoryLeaderboard(
    category: 'LEETCODE' | 'CODEFORCES' | 'GITHUB' | 'PROJECTS',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      // Implementation depends on storing category-specific stats
      // Placeholder for extensibility
      const entries: LeaderboardEntry[] = [];
      return entries;
    } catch (error) {
      console.error('Error fetching category leaderboard:', error);
      throw new Error('Failed to fetch category leaderboard');
    }
  }

  /**
   * Anti-gaming detection: flag suspicious patterns
   */
  async detectSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      // Get recent transactions
      const recentTxs = await this.db.xpTransactions.find({
        userId,
        timestamp: {
          $gte: new Date(Date.now() - 3600000), // Last hour
        },
      }).exec();

      // Check if > 500 XP in < 1 hour
      const totalRecent = recentTxs.reduce((sum: number, tx: any) => sum + tx.xpAmount, 0);

      if (totalRecent > 500) {
        console.warn(`[SUSPICIOUS] User ${userId} earned ${totalRecent} XP in 1 hour`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return false;
    }
  }

  /**
   * Cache management
   */
  private async getFromCache(key: string): Promise<any> {
    try {
      if (this.db.cache) {
        return await this.db.cache.get(key);
      }
      return null;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  private async setCache(key: string, value: any): Promise<void> {
    try {
      if (this.db.cache) {
        await this.db.cache.set(key, value);
      }
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Invalidate cache
   */
  async invalidateCache(period?: string) {
    if (period) {
      await this.db.cache?.delete(`leaderboard:${period}`);
    } else {
      await this.db.cache?.clear();
    }
  }
}