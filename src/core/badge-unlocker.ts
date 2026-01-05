import { Badge, BadgeUnlockEvent } from '../types/badge';
import { Database } from '../database/schema';
import { EventEmitter } from './event-emitter';

export class BadgeUnlocker {
  private db: Database;
  private eventEmitter: EventEmitter;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 5000, 30000]; // ms

  constructor(db: Database, eventEmitter: EventEmitter) {
    this.db = db;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Attempt to unlock badge with retry logic
   */
  async unlockBadgeWithRetry(
    userId: string,
    badgeId: string,
    triggerType: 'AUTO' | 'MANUAL' | 'WEBHOOK' = 'AUTO'
  ): Promise<{ success: boolean; error?: string }> {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const result = await this.unlockBadge(userId, badgeId, triggerType);
        if (result.success) {
          return result;
        }

        // If not successful, wait before retry
        if (attempt < this.MAX_RETRIES - 1) {
          await this.delay(this.RETRY_DELAYS[attempt]);
        }
      } catch (error) {
        if (attempt === this.MAX_RETRIES - 1) {
          // Log to manual review queue
          await this.addToManualReviewQueue(userId, badgeId, error);
          return { success: false, error: String(error) };
        }
      }
    }

    return { success: false, error: 'Max retries exceeded' };
  }

  /**
   * Core badge unlock logic
   */
  private async unlockBadge(
    userId: string,
    badgeId: string,
    triggerType: 'AUTO' | 'MANUAL' | 'WEBHOOK'
  ): Promise<{ success: boolean; error?: string }> {
    // Check if badge exists
    const badgeDefinition = await this.getBadgeDefinition(badgeId);
    if (!badgeDefinition) {
      return { success: false, error: 'Badge not found' };
    }

    // Check if already unlocked
    const existing = await this.db.badges.findOne({ userId, badgeId });
    if (existing?.unlocked) {
      return { success: false, error: 'Badge already unlocked' };
    }

    // Create unlock event
    const event: BadgeUnlockEvent = {
      badgeId,
      userId,
      timestamp: new Date(),
      triggerType,
      triggerData: {},
    };

    // Update database
    await this.db.badges.update({ userId, badgeId }, {
      unlocked: true,
      unlockedAt: new Date(),
      unlockedBy: userId,
    });

    // Record event
    await this.db.badgeEvents.insert(event);

    // Emit event for notifications
    this.eventEmitter.emit('badge:unlocked', {
      userId,
      badge: badgeDefinition,
      timestamp: new Date(),
    });

    return { success: true };
  }

  /**
   * Award XP when badge is unlocked
   */
  async awardBadgeXP(
    userId: string,
    badgeId: string,
    xpAmount: number
  ): Promise<{ xpAdded: number; newTotal: number }> {
    const profile = await this.db.userProfiles.findOne({ userId });

    if (!profile) {
      throw new Error('User profile not found');
    }

    const newTotal = profile.totalXP + xpAmount;

    await this.db.userProfiles.update({ userId }, {
      totalXP: newTotal,
      badges: [...(profile.badges || []), badgeId],
    });

    return { xpAdded: xpAmount, newTotal };
  }

  /**
   * Daily sync of achievements (00:00 UTC)
   */
  async dailyAchievementSync(userId: string): Promise<string[]> {
    const unlockedBadges: string[] = [];

    // Fetch competitive platform stats
    const leetcodeStats = await this.fetchLeetCodeStats(userId);
    const codeforcesStats = await this.fetchCodeforcesStats(userId);
    const githubStats = await this.fetchGitHubStats(userId);

    // Aggregate data
    const userData = {
      leetcodeProblems: leetcodeStats.totalSolved,
      leetcodeHardProblems: leetcodeStats.hardSolved,
      codeforcesRating: codeforcesStats.rating,
      codeforcesContests: codeforcesStats.contestCount,
      codingStreak: githubStats.currentStreak,
      projectsDeployed: 0, // Manual
      prReviewed: githubStats.prReviewed,
      opensourceContribs: githubStats.opensourceContribs,
      blogPosts: 0, // Manual
    };

    // Check all auto-trigger badges
    const AUTO_TRIGGER_BADGES = [
      'badge_001_beginner_solver',
      'badge_002_problem_master',
      'badge_003_algorithm_wizard',
      'badge_004_hard_specialist',
      'badge_005_codeforces_contender',
      'badge_008_code_reviewer',
      'badge_009_open_source_hero',
      'badge_010_consistent_grinder',
      'badge_011_marathon_runner',
    ];

    for (const badgeId of AUTO_TRIGGER_BADGES) {
      const result = await this.unlockBadgeWithRetry(userId, badgeId, 'AUTO');
      if (result.success) {
        unlockedBadges.push(badgeId);
      }
    }

    return unlockedBadges;
  }

  /**
   * Get badge definition
   */
  private async getBadgeDefinition(badgeId: string): Promise<Badge | null> {
    return this.db.badges.findOne({ id: badgeId });
  }

  /**
   * Fetch LeetCode stats via API
   */
  private async fetchLeetCodeStats(userId: string) {
    // Implementation would call LeetCode API
    // For now, placeholder
    return {
      totalSolved: 0,
      hardSolved: 0,
      rating: 0,
    };
  }

  /**
   * Fetch Codeforces stats
   */
  private async fetchCodeforcesStats(userId: string) {
    return {
      rating: 0,
      contestCount: 0,
    };
  }

  /**
   * Fetch GitHub stats
   */
  private async fetchGitHubStats(userId: string) {
    return {
      currentStreak: 0,
      prReviewed: 0,
      opensourceContribs: 0,
    };
  }

  /**
   * Add failed unlock to manual review queue
   */
  private async addToManualReviewQueue(
    userId: string,
    badgeId: string,
    error: any
  ) {
    await this.db.manualReviewQueue.insert({
      userId,
      badgeId,
      error: String(error),
      timestamp: new Date(),
      status: 'PENDING',
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}