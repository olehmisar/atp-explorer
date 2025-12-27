import { discoverATPs, fetchATPData } from "@/lib/atp-detector";
import { AZTEC_TOKEN_ADDRESS } from "@/lib/constants";
import { getTokenHolders } from "@/lib/moralis";
import { getCachedStats, setCachedStats } from "@/lib/redis";
import { calculateUnlockSchedule } from "@/lib/unlock-calculator";
import {
  ATPDashboardData,
  ATPData,
  ATPStats,
  ATPType,
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

export async function GET() {
  try {
    // Check cache FIRST - before any external calls (RPC, Moralis, etc.)
    const cached = await getCachedStats();
    if (cached) {
      console.log(
        "Cache hit - returning cached ATP stats (skipping all RPC/Moralis calls)",
      );
      return NextResponse.json(cached as ATPDashboardData);
    }

    console.log(
      "Cache miss - fetching fresh data (will make RPC and Moralis calls)",
    );

    // Only execute expensive operations if cache miss
    // Fetch token holders from Moralis
    let holders: TokenHolder[] = [];

    if (
      AZTEC_TOKEN_ADDRESS &&
      AZTEC_TOKEN_ADDRESS !== "0x0000000000000000000000000000000000000000"
    ) {
      try {
        holders = await getTokenHolders(AZTEC_TOKEN_ADDRESS);
      } catch (error) {
        console.error("Error fetching token holders:", error);
        // Continue with empty holders if Moralis fails
      }
    }

    // Discover and fetch ATP data
    // Filter out invalid addresses (empty strings, zero addresses, etc.)
    const addresses = holders.map((holder) =>
      holder.address?.toLowerCase().trim(),
    ) as Address[];

    console.log(
      `Checking ${addresses.length} token holders for ATP contracts...`,
    );

    // Pass 0 to check all addresses (unlimited)
    const atpAddresses = await discoverATPs(addresses, 0);
    console.log(`Found ${atpAddresses.length} ATP contracts`);

    // Fetch data for each ATP
    const atpDataPromises = atpAddresses.map((address) =>
      fetchATPData(address),
    );
    const atpDataResults = await Promise.allSettled(atpDataPromises);

    const atps: ATPData[] = [];
    atpDataResults.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        const atp = result.value;
        // Calculate unlock schedule if globalLock exists
        if (atp.globalLock) {
          atp.unlockSchedule = calculateUnlockSchedule(atp.globalLock);
        }
        atps.push(atp);
      } else {
        console.error(
          `Failed to fetch data for ATP ${atpAddresses[index]}:`,
          result.status === "rejected" ? result.reason : "Unknown error",
        );
      }
    });

    // Calculate statistics
    const atpStats = calculateATPStats(atps);

    const stats: ATPStats = {
      ...atpStats,
      tokenHolders: {
        total: holders.length,
        holders: holders.slice(0, 100), // Limit to top 100 holders
      },
    };

    // Prepare response data
    const responseData: ATPDashboardData = {
      stats,
      atps,
    };

    // Cache the response (non-blocking)
    setCachedStats(responseData).catch((err) => {
      console.error("Failed to cache response:", err);
    });

    // Return both stats and ATPs in a single response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in stats API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
