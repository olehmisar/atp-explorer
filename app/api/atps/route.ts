import { discoverATPs, fetchATPData } from "@/lib/atp-detector";
import { AZTEC_TOKEN_ADDRESS } from "@/lib/constants";
import { getTokenHolders } from "@/lib/moralis";
import { ATPData } from "@/types/atp";
import { NextResponse } from "next/server";
import { Address } from "viem";

/**
 * Discover and fetch all ATP contracts
 */
async function getAllATPs(): Promise<ATPData[]> {
  // Step 1: Get all token holders from Moralis
  const tokenHoldersData = await getTokenHolders(AZTEC_TOKEN_ADDRESS); // Uses default EvmChain.ETHEREUM

  // Step 2: Extract addresses (filter out invalid addresses)
  const addresses = tokenHoldersData.map((holder) =>
    holder.address?.toLowerCase().trim(),
  ) as Address[];

  // Limit to first 15 addresses for debugging (adjust as needed)
  const maxAddressesToCheck = parseInt(process.env.MAX_ATP_CHECK || "15", 10);

  console.log(
    `Found ${addresses.length} token holders, checking up to ${maxAddressesToCheck} for ATP contracts...`,
  );

  // Step 3: Discover which addresses are ATP contracts
  const atpAddresses = await discoverATPs(addresses, maxAddressesToCheck);

  console.log(`Found ${atpAddresses.length} ATP contracts`);

  // Step 4: Fetch data for each ATP contract
  const atpDataPromises = atpAddresses.map((address) => fetchATPData(address));
  const atpDataResults = await Promise.allSettled(atpDataPromises);

  // Step 5: Filter out failed fetches and return valid ATP data
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

  return atps;
}

export async function GET() {
  try {
    const atps = await getAllATPs();
    return NextResponse.json(atps);
  } catch (error) {
    console.error("Error in ATPs API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch ATPs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
