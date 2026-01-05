import express from 'express';
import { XPCalculator } from './core/xp-calculator';
import { AchievementManager } from './core/achievement-manager';
import { BadgeUnlocker } from './core/badge-unlocker';
import { LeaderboardManager } from './core/leaderboard-manager';
import { EventEmitter } from './core/event-emitter';
import { GitHubWebhookHandler } from './integrations/github-webhook';
import { createAchievementRoutes } from './api/routes';

const app = express();
const eventEmitter = new EventEmitter();

// Mock database for demo (replace with real DB)
const mockDB = {
  userProfiles: new Map(),
  xpTransactions: new Map(),
  achievements: new Map(),
  badges: new Map(),
  badgeEvents: new Map(),
  manualReviewQueue: new Map(),
  leaderboard: new Map(),
  cache: new Map(),
};

// Initialize core services
const xpCalculator = new XPCalculator(mockDB as any);
const badgeUnlocker = new BadgeUnlocker(mockDB as any, eventEmitter);
const achievementManager = new AchievementManager(mockDB as any, badgeUnlocker);
const leaderboardManager = new LeaderboardManager(mockDB as any);

// Setup GitHub webhook
const githubWebhook = new GitHubWebhookHandler(
  process.env.GITHUB_WEBHOOK_SECRET!,
  xpCalculator
);
githubWebhook.createServer(parseInt(process.env.GITHUB_WEBHOOK_PORT || '8080'));

// Setup API routes
app.use(express.json());
app.use('/api', createAchievementRoutes(xpCalculator, achievementManager, badgeUnlocker, leaderboardManager));

// Event listeners
eventEmitter.on('badge:unlocked', (data: any) => {
  console.log(`🏆 Badge unlocked for ${data.userId}: ${data.badge.name}`);
  // Send notification
});

eventEmitter.on('level:up', (data: any) => {
  console.log(`⬆️ ${data.userId} leveled up to ${data.level}`);
});

// Daily sync (run at 00:00 UTC)
setInterval(async () => {
  console.log('[SYNC] Running daily achievement sync...');
  // Get all users and sync
}, 24 * 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Achievement System running on port ${PORT}`);
});

export { app, xpCalculator, achievementManager, badgeUnlocker, leaderboardManager };
