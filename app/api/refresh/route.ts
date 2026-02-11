import { discoverAndFetchATPs } from "@/lib/atp-detector";
import { AZTEC_TOKEN_ADDRESS } from "@/lib/constants";
import { getTokenHolders } from "@/lib/moralis";
import {
  getCachedHolders,
  redis,
  setCachedATPs,
  setCachedHolders,
  setCachedStats,
  setHoldersLastRefresh,
  setLastRefresh,
  shouldSkipHoldersRefresh,
  shouldSkipRefresh,
} from "@/lib/redis";
import { calculateUnlockSchedule } from "@/lib/unlock-calculator";
import {
  ATPData,
  ATPExplorerData,
  ATPStats,
  ATPType,
  HolderType,
  TokenHolder,
} from "@/types/atp";
import { NextResponse } from "next/server";
import { Address } from "viem";

/**
 * Calculate ATP statistics from ATP data
 */
function calculateATPStats(atps: ATPData[]): Omit<ATPStats, "tokenHolders"> {
  const stats = {
    totalATPs: atps.length,
    totalAllocation: BigInt(0),
    totalClaimed: BigInt(0),
    totalClaimable: BigInt(0),
    totalBalance: BigInt(0),
    byType: {
      [ATPType.Linear]: {
        count: 0,
        totalAllocation: BigInt(0),
        totalClaimed: BigInt(0),
        totalClaimable: BigInt(0),
      },
      [ATPType.Milestone]: {
        count: 0,
        totalAllocation: BigInt(0),
        totalClaimed: BigInt(0),
        totalClaimable: BigInt(0),
      },
      [ATPType.NonClaim]: {
        count: 0,
        totalAllocation: BigInt(0),
        totalClaimed: BigInt(0),
        totalClaimable: BigInt(0),
      },
    },
  };

  atps.forEach((atp) => {
    const allocation = BigInt(atp.allocation);
    const claimed = BigInt(atp.claimed);
    const claimable = BigInt(atp.claimable);
    const balance = BigInt(atp.balance);

    stats.totalAllocation += allocation;
    stats.totalClaimed += claimed;
    stats.totalClaimable += claimable;
    stats.totalBalance += balance;

    const typeStats = stats.byType[atp.type];
    typeStats.count += 1;
    typeStats.totalAllocation += allocation;
    typeStats.totalClaimed += claimed;
    typeStats.totalClaimable += claimable;
  });

  return {
    totalATPs: stats.totalATPs,
    totalAllocation: stats.totalAllocation.toString(),
    totalClaimed: stats.totalClaimed.toString(),
    totalClaimable: stats.totalClaimable.toString(),
    totalBalance: stats.totalBalance.toString(),
    byType: {
      [ATPType.Linear]: {
        count: stats.byType[ATPType.Linear].count,
        totalAllocation:
          stats.byType[ATPType.Linear].totalAllocation.toString(),
        totalClaimed: stats.byType[ATPType.Linear].totalClaimed.toString(),
        totalClaimable: stats.byType[ATPType.Linear].totalClaimable.toString(),
      },
      [ATPType.Milestone]: {
        count: stats.byType[ATPType.Milestone].count,
        totalAllocation:
          stats.byType[ATPType.Milestone].totalAllocation.toString(),
        totalClaimed: stats.byType[ATPType.Milestone].totalClaimed.toString(),
        totalClaimable:
          stats.byType[ATPType.Milestone].totalClaimable.toString(),
      },
      [ATPType.NonClaim]: {
        count: stats.byType[ATPType.NonClaim].count,
        totalAllocation:
          stats.byType[ATPType.NonClaim].totalAllocation.toString(),
        totalClaimed: stats.byType[ATPType.NonClaim].totalClaimed.toString(),
        totalClaimable:
          stats.byType[ATPType.NonClaim].totalClaimable.toString(),
      },
    },
  };
}

/**
 * Refresh cache - Step 1: Fetch and cache holders
 * Uses separate last refresh timestamp for holders
 */
async function refreshHolders(force: boolean = false): Promise<TokenHolder[]> {
  console.log("Step 1: Checking holders cache...");

  // Check if holders refresh should be skipped (unless force)
  const skipHolders = !force && (await shouldSkipHoldersRefresh());
  if (skipHolders) {
    console.log("Skipping holders refresh - data was recently refreshed");
    const cached = await getCachedHolders();
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log(`Using cached holders: ${cached.length} holders`);
      return cached as TokenHolder[];
    }
    console.log("No cached holders found, fetching fresh data...");
  }

  console.log("Fetching token holders from Moralis...");

  let holders: TokenHolder[] = [];

  if (
    AZTEC_TOKEN_ADDRESS &&
    AZTEC_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000"
  ) {
    try {
      holders = await getTokenHolders(AZTEC_TOKEN_ADDRESS);
      console.log(`Fetched ${holders.length} token holders`);
    } catch (error) {
      console.error("Error fetching token holders:", error);
      throw error;
    }
  }

  // Cache holders and update holders last refresh timestamp
  await setCachedHolders(holders);
  await setHoldersLastRefresh(Math.floor(Date.now() / 1000));
  console.log(
    "Step 1 complete: Holders cached with separate last refresh timestamp",
  );

  return holders;
}

/**
 * Refresh cache - Step 2: Discover and fetch ATPs, then cache everything
 * Uses batched discovery and fetching to avoid memory issues
 */
async function refreshATPs(holders: TokenHolder[]): Promise<ATPExplorerData> {
  console.log("Step 2: Discovering and fetching ATPs...");

  // Prepare addresses
  const addresses = holders.map((holder) =>
    holder.address?.toLowerCase().trim(),
  ) as Address[];

  console.log(
    `Checking ${addresses.length} token holders for ATP contracts...`,
  );

  // Discover and fetch ATPs in batches
  const atps = await discoverAndFetchATPs(addresses);

  // Calculate unlock schedules for all ATPs
  // NonClaim uses same linear formula as Linear (claim goes through staking/unstaking)
  console.log("Calculating unlock schedules...");
  atps.forEach((atp) => {
    if (atp.globalLock) {
      // Use allocation for NonClaim vesting amount (linear unlock, same as Linear)
      const lock =
        atp.type === ATPType.NonClaim
          ? { ...atp.globalLock, amount: atp.allocation }
          : atp.globalLock;
      atp.unlockSchedule = calculateUnlockSchedule(lock);
    }
  });

  console.log(`ATP data processed: ${atps.length} ATPs`);

  // Mark holders as ATP if they are one
  const atpAddressSet = new Set<string>(
    atps.map((atp) => atp.address.toLowerCase()),
  );
  const holdersWithType: TokenHolder[] = holders.map((holder) => {
    const isATP = atpAddressSet.has(holder.address.toLowerCase());
    return {
      ...holder,
      type: isATP ? ("atp" as HolderType) : undefined, // We'll detect contract vs user later if needed
    };
  });

  console.log("Holders with type processed");

  // Cache ATPs
  await setCachedATPs(atps);
  console.log("Step 2 complete: ATPs cached");

  // Calculate statistics
  const atpStats = calculateATPStats(atps);

  const stats: ATPStats = {
    ...atpStats,
    tokenHolders: {
      total: holders.length,
      holders: holdersWithType,
    },
  };

  const lastUpdated = Date.now();
  const responseData: ATPExplorerData = {
    stats,
    atps,
    lastUpdated,
  };

  // Cache complete stats
  await setCachedStats(responseData);
  console.log("Cache refresh complete");

  return responseData;
}

/**
 * Refresh endpoint - can be called by anyone
 * Should be called daily via Vercel Cron or similar
 *
 * Query params:
 * - force=1: Bypass skip checks and force full refresh
 *
 * Uses Redis to prevent race conditions and DDoS:
 * - Only one refresh can run at a time (lock)
 * - Skips refresh if data was refreshed within 90% of refresh interval
 */
export async function GET(request: Request) {
  const LOCK_KEY = "atp:refresh:lock";
  const LOCK_TTL = 3600; // 1 hour lock timeout

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  try {
    // Check if refresh should be skipped (unless force=1)
    const skip = !force && (await shouldSkipRefresh());
    if (skip) {
      console.log("Skipping refresh - data was recently refreshed");
      return NextResponse.json({
        success: false,
        message: "Refresh skipped - data was recently refreshed",
      });
    }

    // Check if refresh is already in progress (prevent race conditions)
    if (redis) {
      const lock = await redis.get(LOCK_KEY);
      if (lock) {
        console.log("Cache refresh already in progress, skipping...");
        return NextResponse.json({
          success: false,
          message: "Cache refresh already in progress",
        });
      }

      // Set lock
      await redis.setex(LOCK_KEY, LOCK_TTL, "1");
    }

    console.log("Starting cache refresh...");

    try {
      // Step 1: Fetch and cache holders
      const holders = await refreshHolders(force);

      // Step 2: Discover ATPs and cache everything
      const data = await refreshATPs(holders);

      // Update last refresh timestamp
      await setLastRefresh(Math.floor(Date.now() / 1000));

      // Release lock
      if (redis) {
        await redis.del(LOCK_KEY).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: "Cache refreshed successfully",
        stats: {
          holdersCount: holders.length,
          atpsCount: data.atps.length,
          lastUpdated: data.lastUpdated,
        },
      });
    } catch (error) {
      // Release lock on error
      if (redis) {
        await redis.del(LOCK_KEY).catch(() => {});
      }
      throw error;
    }
  } catch (error) {
    console.error("Error refreshing cache:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh cache",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
