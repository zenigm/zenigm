import { Router } from 'express';
import { XPCalculator } from '../core/xp-calculator';
import { AchievementManager } from '../core/achievement-manager';
import { BadgeUnlocker } from '../core/badge-unlocker';
import { LeaderboardManager } from '../core/leaderboard-manager';

export function createAchievementRoutes(
  xpCalc: XPCalculator,
  achievementMgr: AchievementManager,
  badgeUnlocker: BadgeUnlocker,
  leaderboardMgr: LeaderboardManager
) {
  const router = Router();

  /**
   * GET /api/xp/profile/:userId
   * Get user's XP profile
   */
  router.get('/xp/profile/:userId', async (req, res) => {
    try {
      const profile = await xpCalc.getUserProfile(req.params.userId);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * POST /api/xp/add
   * Manually add XP (admin only)
   */
  router.post('/xp/add', async (req, res) => {
    const { userId, sourceType, metadata } = req.body;

    try {
      const result = await xpCalc.addXP(userId, sourceType, metadata);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  /**
   * GET /api/achievements/:userId
   * Get user's achievements
   */
  router.get('/achievements/:userId', async (req, res) => {
    try {
      const stats = await achievementMgr.getAchievementStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * POST /api/badges/unlock
   * Manually unlock badge (admin)
   */
  router.post('/badges/unlock', async (req, res) => {
    const { userId, badgeId } = req.body;

    try {
      const result = await badgeUnlocker.unlockBadgeWithRetry(userId, badgeId, 'MANUAL');
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  });

  /**
   * GET /api/leaderboard
   * Get global leaderboard
   */
  router.get('/leaderboard', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    const period = (req.query.period as any) || 'ALL_TIME';

    try {
      const leaderboard = await leaderboardMgr.getLeaderboard(limit, offset, period);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * GET /api/leaderboard/position/:userId
   * Get user's position on leaderboard
   */
  router.get('/leaderboard/position/:userId', async (req, res) => {
    try {
      const position = await leaderboardMgr.getUserPosition(req.params.userId);
      res.json(position);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  /**
   * POST /api/sync/daily
   * Trigger daily achievement sync
   */
  router.post('/sync/daily/:userId', async (req, res) => {
    try {
      const unlocked = await badgeUnlocker.dailyAchievementSync(req.params.userId);
      res.json({ unlockedBadges: unlocked });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
}
