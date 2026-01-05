export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalXP: number;
  currentLevel: number;
  badges: number;
  achievements: number;
  lastActive: Date;
}

export interface LeaderboardStats {
  period: 'ALL_TIME' | 'SEASONAL' | 'MONTHLY' | 'WEEKLY';
  entries: LeaderboardEntry[];
  totalPlayers: number;
  generatedAt: Date;
}

export interface UserLeaderboardPosition {
  userId: string;
  currentRank: number;
  previousRank?: number;
  percentile: number; // 0-100
  xpAhead: number; // XP needed to reach next rank
  xpBehind: number; // XP ahead of player below
}

export interface LeaderboardResetConfig {
  period: 'ALL_TIME' | 'SEASONAL' | 'MONTHLY' | 'WEEKLY';
  lastReset: Date;
  nextReset: Date;
  enabled: boolean;
}