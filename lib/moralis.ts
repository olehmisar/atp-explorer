import { withRetry } from "@/lib/retry";
import { TokenHolder } from "@/types/atp";
import Moralis from "moralis";

// Initialize Moralis (you'll need to set MORALIS_API_KEY in your .env file)
export async function initializeMoralis() {
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY || "",
    });
  }
}

/**
 * Fetch a single page of token owners
 */
async function fetchTokenOwnersPage(
  tokenAddress: string,
  chain: string,
  cursor?: string,
): Promise<{ owners: TokenHolder[]; cursor?: string }> {
  await initializeMoralis();

  const response = await Moralis.EvmApi.token.getTokenOwners({
    tokenAddress: tokenAddress,
    chain: chain,
    limit: 100, // Maximum page size
    cursor: cursor,
  });

  const result = response.raw();
  const owners = result.result || [];
  const nextCursor = result.cursor;

  const tokenHolders: TokenHolder[] = owners.map((owner) => ({
    address: owner.owner_address,
    balance: owner.balance,
    tokenAddress: tokenAddress,
  }));

  return {
    owners: tokenHolders,
    cursor: nextCursor,
  };
}

/**
 * Fetch token holders (limited to 100 for performance)
 * Uses retry logic for reliability
 */
export async function getTokenHolders(
  tokenAddress: string,
  chain: string = "0x1", // Default to Ethereum mainnet (chain ID as hex string)
  limit: number = 100, // Limit to 100 holders for performance
): Promise<TokenHolder[]> {
  return withRetry(async () => {
    await initializeMoralis();

    // Fetch only the first page (up to 100 holders)
    const { owners } = await fetchTokenOwnersPage(tokenAddress, chain);

    console.log(`Fetched ${owners.length} token holders (limited to ${limit})`);

    return owners.slice(0, limit);
  });
}

export async function getTokenMetadata(
  tokenAddress: string,
  chain: string = "0x1", // Default to Ethereum mainnet (chain ID as hex string)
) {
  await initializeMoralis();

  try {
    const response = await Moralis.EvmApi.token.getTokenMetadata({
      addresses: [tokenAddress],
      chain: chain,
    });

    return response.raw[0];
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    throw error;
  }
}
