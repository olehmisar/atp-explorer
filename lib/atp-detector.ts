import { ATPData, ATPType } from "@/types/atp";
import { Address, createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { AZTEC_TOKEN_ADDRESS } from "./constants";
import { withRetry } from "./retry";

// ATP contract ABI - minimal interface for detection and data fetching
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
  {
    name: "getMilestoneId",
    type: "function",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
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
 * Create a public client for Ethereum mainnet with batch multicall enabled
 */
function createClient() {
  return createPublicClient({
    batch: {
      multicall: {
        batchSize: 10000,
      },
    },
    chain: mainnet,
    transport: http(process.env.RPC_URL || "https://eth.llamarpc.com"),
  });
}

/**
 * Check if an address is an ATP contract by trying to call getType() and getBeneficiary()
 * Batch multicall is enabled in the client, so these calls will be automatically batched
 */
export async function isATPContract(address: Address): Promise<boolean> {
  const client = createClient();

  try {
    // These calls will be automatically batched by viem's multicall
    const [type, beneficiary] = await Promise.all([
      client.readContract({
        address,
        abi: ATP_ABI,
        functionName: "getType",
      }),
      client.readContract({
        address,
        abi: ATP_ABI,
        functionName: "getBeneficiary",
      }),
    ]);

    // If both calls succeed and return valid data, it's an ATP
    return (
      typeof type === "number" &&
      type >= 0 &&
      type <= 2 &&
      typeof beneficiary === "string"
    );
  } catch (error) {
    // If either call fails, it's not an ATP contract
    // Don't log errors for invalid addresses - this is expected
    return false;
  }
}

/**
 * Fetch ATP data from a contract address
 */
export async function fetchATPData(
  atpAddress: Address,
): Promise<ATPData | null> {
  try {
    return await withRetry(async () => {
      const client = createClient();

      // Batch multicall is enabled in the client, so all calls will be automatically batched
      // Do all calls in parallel, including optional ones
      const [
        type,
        beneficiary,
        allocation,
        claimed,
        claimable,
        isRevokable,
        globalLock,
        balance,
        isRevokedResult,
        milestoneIdResult,
      ] = await Promise.allSettled([
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
        client.readContract({
          address: atpAddress,
          abi: ATP_ABI,
          functionName: "getGlobalLock",
        }),
        client.readContract({
          address: AZTEC_TOKEN_ADDRESS as Address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [atpAddress],
        }),
        // Optional calls - may fail for some ATP types
        client
          .readContract({
            address: atpAddress,
            abi: ATP_ABI,
            functionName: "getIsRevoked",
          })
          .catch(() => null),
        client
          .readContract({
            address: atpAddress,
            abi: ATP_ABI,
            functionName: "getMilestoneId",
          })
          .catch(() => null),
      ]);

      // Extract required fields (must succeed)
      const failedFields: string[] = [];
      if (type.status !== "fulfilled") {
        failedFields.push("getType");
        console.error(
          `Failed to fetch getType for ${atpAddress}:`,
          type.status === "rejected" ? type.reason : "unknown error",
        );
      }
      if (beneficiary.status !== "fulfilled") {
        failedFields.push("getBeneficiary");
        console.error(
          `Failed to fetch getBeneficiary for ${atpAddress}:`,
          beneficiary.status === "rejected"
            ? beneficiary.reason
            : "unknown error",
        );
      }
      if (allocation.status !== "fulfilled") {
        failedFields.push("getAllocation");
        console.error(
          `Failed to fetch getAllocation for ${atpAddress}:`,
          allocation.status === "rejected"
            ? allocation.reason
            : "unknown error",
        );
      }
      if (claimed.status !== "fulfilled") {
        failedFields.push("getClaimed");
        console.error(
          `Failed to fetch getClaimed for ${atpAddress}:`,
          claimed.status === "rejected" ? claimed.reason : "unknown error",
        );
      }
      if (claimable.status !== "fulfilled") {
        failedFields.push("getClaimable");
        console.error(
          `Failed to fetch getClaimable for ${atpAddress}:`,
          claimable.status === "rejected" ? claimable.reason : "unknown error",
        );
      }
      if (isRevokable.status !== "fulfilled") {
        failedFields.push("getIsRevokable");
        console.error(
          `Failed to fetch getIsRevokable for ${atpAddress}:`,
          isRevokable.status === "rejected"
            ? isRevokable.reason
            : "unknown error",
        );
      }
      if (globalLock.status !== "fulfilled") {
        failedFields.push("getGlobalLock");
        console.error(
          `Failed to fetch getGlobalLock for ${atpAddress}:`,
          globalLock.status === "rejected"
            ? globalLock.reason
            : "unknown error",
        );
      }
      if (balance.status !== "fulfilled") {
        failedFields.push("balanceOf");
        console.error(
          `Failed to fetch balanceOf for ${atpAddress}:`,
          balance.status === "rejected" ? balance.reason : "unknown error",
        );
      }

      if (failedFields.length > 0) {
        const errorMessage = `Failed to fetch required ATP data for ${atpAddress}. Failed fields: ${failedFields.join(
          ", ",
        )}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      // At this point, all required fields are fulfilled, so we can safely access .value
      const typeValue = (type as PromiseFulfilledResult<number>).value;
      const beneficiaryValue = (beneficiary as PromiseFulfilledResult<Address>)
        .value;
      const allocationValue = (allocation as PromiseFulfilledResult<bigint>)
        .value;
      const claimedValue = (claimed as PromiseFulfilledResult<bigint>).value;
      const claimableValue = (claimable as PromiseFulfilledResult<bigint>)
        .value;
      const isRevokableValue = (isRevokable as PromiseFulfilledResult<boolean>)
        .value;
      const globalLockValue = globalLock as PromiseFulfilledResult<
        readonly [bigint, bigint, bigint, bigint]
      >;
      const balanceValue = (balance as PromiseFulfilledResult<bigint>).value;

      // Extract optional fields (may fail)
      const isRevoked =
        isRevokedResult.status === "fulfilled" && isRevokedResult.value !== null
          ? (isRevokedResult.value as boolean)
          : false;

      const milestoneId =
        milestoneIdResult.status === "fulfilled" &&
        milestoneIdResult.value !== null
          ? (milestoneIdResult.value as bigint).toString()
          : undefined;

      let milestoneStatus: "Pending" | "Succeeded" | "Failed" | undefined;

      // Map type enum to ATPType
      const atpTypeMap: Record<number, ATPType> = {
        0: ATPType.Linear,
        1: ATPType.Milestone,
        2: ATPType.NonClaim,
      };

      const atpType = atpTypeMap[Number(typeValue)] || ATPType.Linear;

      // Convert all BigInt values to strings for JSON serialization
      // globalLock returns Lock struct: [startTime, cliff, endTime, allocation]
      // All values are in SECONDS (Unix timestamps for startTime/cliff/endTime)
      const globalLockTuple = globalLockValue.value;

      // Contract returns Lock struct: {startTime, cliff, endTime, allocation}
      const startTimeSeconds = Number(globalLockTuple[0]);
      const cliffSeconds = Number(globalLockTuple[1]); // This is cliff timestamp, not duration!
      const endTimeSeconds = Number(globalLockTuple[2]); // This is endTime timestamp, not duration!
      const lockAmount = globalLockTuple[3];

      // Calculate durations from timestamps
      const cliffDurationSeconds = cliffSeconds - startTimeSeconds;
      const lockDurationSeconds = endTimeSeconds - startTimeSeconds;

      // Convert from seconds (RPC) to milliseconds (JavaScript standard)
      const startTime = startTimeSeconds * 1000; // Convert seconds to milliseconds
      const cliffDuration = cliffDurationSeconds * 1000; // Duration in milliseconds
      const lockDuration = lockDurationSeconds * 1000; // Duration in milliseconds

      return {
        address: atpAddress,
        type: atpType,
        beneficiary: beneficiaryValue as string,
        allocation:
          typeof allocationValue === "bigint"
            ? allocationValue.toString()
            : String(allocationValue),
        claimed:
          typeof claimedValue === "bigint"
            ? claimedValue.toString()
            : String(claimedValue),
        claimable:
          typeof claimableValue === "bigint"
            ? claimableValue.toString()
            : String(claimableValue),
        balance:
          typeof balanceValue === "bigint"
            ? balanceValue.toString()
            : String(balanceValue),
        isRevokable: isRevokableValue as boolean,
        isRevoked,
        globalLock: {
          startTime, // Unix timestamp in milliseconds
          cliffDuration, // Duration in milliseconds (cliff - startTime)
          lockDuration, // Duration in milliseconds (endTime - startTime)
          amount: lockAmount.toString(), // Convert BigInt to string for JSON serialization
        },
        milestoneId,
        milestoneStatus,
      };
    }, 3); // 3 retries for ATP data fetching
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error fetching ATP data for ${atpAddress} after retries:`,
      errorMessage,
    );
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    // Re-throw the error instead of silently returning null
    throw new Error(
      `Failed to fetch ATP data for ${atpAddress}: ${errorMessage}`,
    );
  }
}

/**
 * Discover ATP contracts from a list of addresses
 * Batch multicall is enabled in the client, so all calls will be automatically batched
 * @param addresses - List of addresses to check
 * @param maxAddresses - Maximum number of addresses to check (default: 1000, set to 0 for unlimited)
 */
export async function discoverATPs(
  addresses: Address[],
  maxAddresses: number,
): Promise<Address[]> {
  const atpAddresses: Address[] = [];
  console.log("addresses", addresses);

  // Limit the number of addresses to check if specified
  const addressesToCheck =
    maxAddresses > 0 ? addresses.slice(0, maxAddresses) : addresses;

  const invalidCount = addresses.length - addresses.length;
  if (invalidCount > 0) {
    console.log(
      `Filtered out ${invalidCount} invalid addresses (empty or invalid format)`,
    );
  }

  console.log(
    `Checking ${addressesToCheck.length} valid addresses for ATP contracts...`,
  );

  // Process all addresses - viem will automatically batch the readContract calls
  // Process in smaller batches to avoid overwhelming the RPC with too many calls at once
  const batchSize = 50; // Process 50 addresses at a time
  for (let i = 0; i < addressesToCheck.length; i += batchSize) {
    const batch = addressesToCheck.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}: addresses ${
        i + 1
      }-${Math.min(i + batchSize, addressesToCheck.length)}`,
    );

    const results = await Promise.allSettled(
      batch.map((address) => isATPContract(address)),
    );

    results.forEach((result, index) => {
      const address = batch[index];
      if (result.status === "fulfilled" && result.value) {
        atpAddresses.push(address);
      }
      // Don't log errors - invalid addresses are expected and handled silently
    });

    console.log(`Batch complete: ${atpAddresses.length} ATPs found so far`);
  }

  console.log(
    `Discovery complete: ${atpAddresses.length} ATP contracts found out of ${addressesToCheck.length} addresses checked`,
  );
  return atpAddresses;
}
