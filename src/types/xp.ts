export interface XPSource {
  type: string;
  activity: string;
  xpAmount: number;
  frequency: 'ONE_TIME' | 'REPEATABLE' | 'DAILY' | 'CONTEST_BASED';
  maxDaily?: number;
  requiresProof?: boolean;
}

export interface XPTransaction {
  id: string;
  userId: string;
  sourceType: string;
  xpAmount: number;
  timestamp: Date;
  verified: boolean;
  metadata: Record<string, any>; // GitHub commit SHA, LeetCode problem ID, etc.
}

export interface UserXPProfile {
  userId: string;
  totalXP: number;
  currentLevel: number;
  levelProgress: number; // 0-100%
  nextLevelThreshold: number;
  xpHistory: XPTransaction[];
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date;
  };
  badges: string[]; // badge IDs
  achievements: string[]; // achievement IDs
}

export interface LevelInfo {
  level: number;
  minXP: number;
  maxXP: number;
  title: string;
  rank: string;
  unlocks: string[];
  color: string;
}

export const LEVEL_THRESHOLDS: Record<number, LevelInfo> = {
  1: {
    level: 1,
    minXP: 0,
    maxXP: 100000,
    title: 'Novice Coder',
    rank: '■░░░░░░░░░',
    unlocks: ['discord_role'],
    color: '#6B7280',
  },
  2: {
    level: 2,
    minXP: 100000,
    maxXP: 200000,
    title: 'Apprentice Engineer',
    rank: '■■░░░░░░░░',
    unlocks: ['private_repo_access'],
    color: '#4B7CFF',
  },
  3: {
    level: 3,
    minXP: 200000,
    maxXP: 350000,
    title: 'Junior Developer',
    rank: '■■■░░░░░░░',
    unlocks: ['mentor_badge'],
    color: '#1ade80',
  },
  4: {
    level: 4,
    minXP: 350000,
    maxXP: 550000,
    title: 'Intermediate Engineer',
    rank: '■■■■░░░░░░',
    unlocks: ['github_star_privileges'],
    color: '#FF8C00',
  },
  5: {
    level: 5,
    minXP: 550000,
    maxXP: 800000,
    title: 'Senior Developer',
    rank: '■■■■■░░░░░',
    unlocks: ['advisory_board_access'],
    color: '#FFD700',
  },
  // ... up to level 10+
};