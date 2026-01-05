import { XPCalculator } from '../core/xp-calculator';
import { AchievementManager } from '../core/achievement-manager';
import { BadgeUnlocker } from '../core/badge-unlocker';
import { EventEmitter } from '../core/event-emitter';
import { Database } from '../database/schema';

// Mock database implementation for testing
function createMockDatabase(): Database {
  const storage = {
    userProfiles: [] as any[],
    xpTransactions: [] as any[],
    achievements: [] as any[],
    badges: [] as any[],
    badgeEvents: [] as any[],
    manualReviewQueue: [] as any[],
    leaderboard: [] as any[],
  };

  const createCollection = (data: any[]) => {
    const find = (query: any = {}) => {
      let results = data;
      
      // Simple query filtering
      if (query.userId) {
        results = results.filter(item => item.userId === query.userId);
      }
      if (query.sourceType) {
        results = results.filter(item => item.sourceType === query.sourceType);
      }
      if (query.id) {
        results = results.filter(item => item.id === query.id);
      }
      
      const queryBuilder = {
        sort: (sortObj: any) => queryBuilder,
        limit: (count: number) => queryBuilder,
        skip: (count: number) => queryBuilder,
        exec: () => Promise.resolve(results),
        reduce: Array.prototype.reduce.bind(results),
        forEach: Array.prototype.forEach.bind(results),
        map: Array.prototype.map.bind(results),
        filter: Array.prototype.filter.bind(results),
        [Symbol.iterator]: Array.prototype[Symbol.iterator].bind(results),
      };
      
      return queryBuilder;
    };

    return {
      find,
      findOne: (query: any) => {
        const results = find(query).exec();
        return results.then(items => items[0] || null);
      },
      insertOne: (doc: any) => {
        data.push(doc);
        return Promise.resolve({ insertedId: doc.id || String(Date.now()) });
      },
      insert: (doc: any) => {
        return data.push(doc), Promise.resolve({ insertedId: doc.id || String(Date.now()) });
      },
      updateOne: (query: any, update: any) => {
        const index = data.findIndex(item => item.userId === query.userId || item.id === query.id);
        if (index !== -1) {
          Object.assign(data[index], update);
        }
        return Promise.resolve({ matchedCount: index !== -1 ? 1 : 0, modifiedCount: index !== -1 ? 1 : 0 });
      },
      update: (query: any, update: any) => {
        const index = data.findIndex(item => item.userId === query.userId || item.id === query.id);
        if (index !== -1) {
          Object.assign(data[index], update);
        }
        return Promise.resolve({ matchedCount: index !== -1 ? 1 : 0, modifiedCount: index !== -1 ? 1 : 0 });
      },
      deleteOne: (query: any) => {
        const index = data.findIndex(item => item.userId === query.userId || item.id === query.id);
        if (index !== -1) {
          data.splice(index, 1);
        }
        return Promise.resolve({ deletedCount: index !== -1 ? 1 : 0 });
      },
      count: (query: any = {}) => {
        return find(query).exec().then(items => items.length);
      }
    };
  };

  return {
    userProfiles: createCollection(storage.userProfiles),
    xpTransactions: createCollection(storage.xpTransactions),
    achievements: createCollection(storage.achievements),
    badges: createCollection(storage.badges),
    badgeEvents: createCollection(storage.badgeEvents),
    manualReviewQueue: createCollection(storage.manualReviewQueue),
    leaderboard: createCollection(storage.leaderboard),
  };
}

describe('Achievement System', () => {
  let xpCalc: XPCalculator;
  let achievementMgr: AchievementManager;
  let badgeUnlocker: BadgeUnlocker;

  beforeEach(() => {
    const mockDB = createMockDatabase();
    const eventEmitter = new EventEmitter();

    xpCalc = new XPCalculator(mockDB);
    badgeUnlocker = new BadgeUnlocker(mockDB, eventEmitter);
    achievementMgr = new AchievementManager(mockDB, badgeUnlocker);
  });

  test('Should add XP correctly', async () => {
    const result = await xpCalc.addXP('test_user', 'CODE_COMMIT', {
      sha: 'abc123',
    });

    expect(result.xpAdded).toBe(10);
    expect(result.newTotal).toBe(10);
    expect(result.leveledUp).toBe(false);
  });

  test('Should level up at 100,000 XP', async () => {
    // Add 100,000 XP worth of transactions
    for (let i = 0; i < 200; i++) {
      await xpCalc.addXP('test_user', 'PR_MERGED', {});
    }

    const profile = await xpCalc.getUserProfile('test_user');
    expect(profile.currentLevel).toBeGreaterThanOrEqual(2);
  });

  test('Should unlock achievement when conditions met', async () => {
    const result = await achievementMgr.checkAndUnlockAchievement('test_user', 'badge_001_beginner_solver', {
      leetcodeProblems: 50,
    });

    expect(result.unlocked).toBe(true);
    expect(result.xpAwarded).toBe(500);
  });

  test('Should not unlock achievement twice', async () => {
    // First unlock
    await achievementMgr.checkAndUnlockAchievement('test_user', 'badge_001_beginner_solver', {
      leetcodeProblems: 50,
    });

    // Second attempt
    const result = await achievementMgr.checkAndUnlockAchievement('test_user', 'badge_001_beginner_solver', {
      leetcodeProblems: 50,
    });

    expect(result.unlocked).toBe(false);
  });
});
