export type BadgeRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'IMMORTAL';

export interface BadgeUnlockCriteria {
  type: string;
  threshold: number;
  autoTrigger: boolean;
  platform?: 'LEETCODE' | 'CODEFORCES' | 'GITHUB' | 'CUSTOM';
  apiCheck?: {
    endpoint: string;
    field: string;
    operator: '>' | '>=' | '=' | '<' | '<=';
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  xpReward: number;
  category: string;
  unlockCriteria: BadgeUnlockCriteria;
  unlocked: boolean;
  unlockedAt?: Date;
  unlockedBy?: string;
  displayPosition?: string;
  displayOrder?: number;
  tooltip?: string;
}

export interface BadgeUnlockEvent {
  badgeId: string;
  userId: string;
  timestamp: Date;
  triggerType: 'AUTO' | 'MANUAL' | 'WEBHOOK';
  triggerData: any;
}

export interface BadgeColorScheme {
  rarity: BadgeRarity;
  color: string;
  hexCode: string;
  displaySymbol: string;
}