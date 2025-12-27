/**
 * Example implementation for fetching ATP data from on-chain contracts
 *
 * This file demonstrates how to integrate with real ATP contracts using ethers.js or viem.
 * Replace the mock data in /app/api/stats/route.ts and /app/api/atps/route.ts with
 * actual on-chain queries using the patterns shown here.
 */

import { ATPData, ATPType } from "@/types/atp";
import { Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";

// Example: ATP contract ABI (simplified - add all required functions)
const ATP_ABI = [
  {
    name: "getType",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    name: "getBeneficiary",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    name: "getAllocation",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "getClaimed",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "getClaimable",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "getIsRevokable",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "getIsRevoked",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    name: "getGlobalLock",
    type: "function",
    inputs: [],
    outputs: [
      { name: "startTime", type: "uint256" },
      { name: "cliff", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "allocation", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

/**
 * Create a public client for Ethereum mainnet
 */
function createClient() {
  return createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL || "https://eth.llamarpc.com"),
  });
}

/**
 * Fetch ATP data from a contract address
 */
export async function fetchATPData(
  atpAddress: Address,
  tokenAddress: Address,
): Promise<ATPData> {
  const client = createClient();

  try {
    // Fetch all ATP data in parallel
    const [
      type,
      beneficiary,
      allocation,
      claimed,
      claimable,
      isRevokable,
      isRevoked,
      globalLock,
      balance,
    ] = await Promise.all([
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getType",
      }),
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getBeneficiary",
      }),
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getAllocation",
      }),
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getClaimed",
      }),
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getClaimable",
      }),
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getIsRevokable",
      }),
      client
        .readContract({
          address: atpAddress,
          abi: ATP_ABI,
          functionName: "getIsRevoked",
        })
        .catch(() => false), // Some ATPs might not have this function
      client.readContract({
        address: atpAddress,
        abi: ATP_ABI,
        functionName: "getGlobalLock",
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [atpAddress],
      }),
    ]);

    // Map type enum to ATPType
    const atpTypeMap: Record<number, ATPType> = {
      0: ATPType.Linear,
      1: ATPType.Milestone,
      2: ATPType.NonClaim,
    };

    // Contract returns Lock struct: [startTime, cliff, endTime, allocation]
    // All values are in seconds (Unix timestamps for startTime/cliff/endTime)
    const startTimeSeconds = Number(globalLock[0]);
    const cliffSeconds = Number(globalLock[1]); // This is cliff timestamp, not duration!
    const endTimeSeconds = Number(globalLock[2]); // This is endTime timestamp, not duration!
    const lockAmount = globalLock[3];

    // Calculate durations from timestamps
    const cliffDurationSeconds = cliffSeconds - startTimeSeconds;
    const lockDurationSeconds = endTimeSeconds - startTimeSeconds;

    // Convert from seconds (RPC) to milliseconds (JavaScript standard)
    const startTime = startTimeSeconds * 1000;
    const cliffDuration = cliffDurationSeconds * 1000;
    const lockDuration = lockDurationSeconds * 1000;

    return {
      address: atpAddress,
      type: atpTypeMap[Number(type)] || ATPType.Linear,
      beneficiary: beneficiary as string,
      allocation: allocation.toString(),
      claimed: claimed.toString(),
      claimable: claimable.toString(),
      balance: balance.toString(),
      isRevokable: isRevokable as boolean,
      isRevoked: (isRevoked as boolean) || false,
      globalLock: {
        startTime, // Unix timestamp in milliseconds
        cliffDuration, // Duration in milliseconds (cliff - startTime)
        lockDuration, // Duration in milliseconds (endTime - startTime)
        amount: lockAmount.toString(), // Convert BigInt to string
      },
    };
  } catch (error) {
    console.error(`Error fetching ATP data for ${atpAddress}:`, error);
    throw error;
  }
}

/**
 * Get all ATP addresses from a factory contract or registry
 *
 * This is a placeholder - implement based on your factory/registry contract
 */
export async function getAllATPAddresses(): Promise<Address[]> {
  // Example: Query factory contract for all deployed ATPs
  // const factory = await client.readContract({
  //   address: FACTORY_ADDRESS,
  //   abi: FACTORY_ABI,
  //   functionName: 'getAllATPs',
  // });
  // return factory;

  // For now, return empty array - replace with actual implementation
  return [];
}
