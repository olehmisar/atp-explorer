export enum ATPType {
  Linear = "Linear",
  Milestone = "Milestone",
  NonClaim = "NonClaim",
}

export interface Lock {
  startTime: number;
  cliffDuration: number;
  lockDuration: number;
  amount: string; // Changed from bigint to string for JSON serialization
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
  milestoneId?: string;
  milestoneStatus?: "Pending" | "Succeeded" | "Failed";
  operator?: string;
  staker?: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  balanceFormatted: string;
  tokenAddress: string;
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
}
