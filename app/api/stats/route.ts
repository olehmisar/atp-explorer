import { discoverATPs, fetchATPData } from "@/lib/atp-detector";
import { AZTEC_TOKEN_ADDRESS, MAX_ATP_CHECK } from "@/lib/constants";
import { getTokenHolders } from "@/lib/moralis";
import { ATPData, ATPStats, ATPType, TokenHolder } from "@/types/atp";
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

    // Use the constant from constants.ts
    const maxAddressesToCheck = MAX_ATP_CHECK;

    console.log(
      `Checking up to ${maxAddressesToCheck} token holders for ATP contracts...`,
    );

    const atpAddresses = await discoverATPs(addresses, maxAddressesToCheck);
    console.log(`Found ${atpAddresses.length} ATP contracts`);

    // Fetch data for each ATP
    const atpDataPromises = atpAddresses.map((address) =>
      fetchATPData(address),
    );
    const atpDataResults = await Promise.allSettled(atpDataPromises);

    const atps: ATPData[] = [];
    atpDataResults.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        atps.push(result.value);
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

    // Return both stats and ATPs in a single response
    return NextResponse.json({
      stats,
      atps,
    });
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
