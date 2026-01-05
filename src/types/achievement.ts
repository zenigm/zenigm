
export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'COMPETITIVE_PROGRAMMING' | 'PROJECT' | 'LEARNING' | 'MILESTONE' | 'SPECIAL';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  unlockedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AchievementProgress {
  userId: string;
  achievementId: string;
  progress: number; // 0-100%
  currentValue: number; // e.g., 50 problems solved
  targetValue: number; // e.g., 100 problems needed
  unlocked: boolean;
  lastUpdated: Date;
}

export interface AchievementCategory {
  category: string;
  description: string;
  achievements: Achievement[];
  totalCount: number;
  unlockedCount: number;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedAchievements: number;
  completionPercentage: number;
  rareUnlocks: number;
  epicUnlocks: number;
  legendaryUnlocks: number;
}