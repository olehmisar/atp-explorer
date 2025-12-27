export enum ATPType {
  Linear = "Linear",
  Milestone = "Milestone",
  NonClaim = "NonClaim",
}

export interface Lock {
  startTime: number; // Unix timestamp in milliseconds
  cliffDuration: number; // Duration in milliseconds
  lockDuration: number; // Duration in milliseconds
  amount: string; // Changed from bigint to string for JSON serialization
}

export interface UnlockSchedule {
  cliffEnd: number; // Timestamp when cliff ends
  fullUnlock: number; // Timestamp when fully unlocked
  currentUnlocked: string; // Amount currently unlocked
  fullyUnlocked: boolean; // Whether the lock has fully unlocked
}

export interface ATPData {
  address: string;
  type: ATPType;
  beneficiary: string;
  allocation: string;
  claimed: string;
  claimable: string;
  balance: string;
  isRevokable: boolean;
  isRevoked: boolean;
  globalLock?: Lock;
  accumulationLock?: Lock;
  unlockSchedule?: UnlockSchedule; // Calculated unlock schedule
  milestoneId?: string;
  milestoneStatus?: "Pending" | "Succeeded" | "Failed";
  operator?: string;
  staker?: string;
}

export type HolderType = "user" | "contract" | "atp";

export interface TokenHolder {
  address: string;
  balance: string;
  tokenAddress: string;
  type?: HolderType; // Type of holder: user, contract, or ATP
}

export interface ATPStats {
  totalATPs: number;
  totalAllocation: string;
  totalClaimed: string;
  totalClaimable: string;
  totalBalance: string;
  byType: {
    [key in ATPType]: {
      count: number;
      totalAllocation: string;
      totalClaimed: string;
      totalClaimable: string;
    };
  };
  tokenHolders: {
    total: number;
    holders: TokenHolder[];
  };
}

export interface ATPDashboardData {
  stats: ATPStats;
  atps: ATPData[];
  lastUpdated: number; // Unix timestamp in milliseconds
}
