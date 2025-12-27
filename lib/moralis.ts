import { MAX_ATP_CHECK } from "@/lib/constants";
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
 * Fetch a single page of token owners with retry logic
 */
async function fetchTokenOwnersPage(
  tokenAddress: string,
  chain: string,
  cursor?: string,
): Promise<{ owners: TokenHolder[]; cursor?: string }> {
  return withRetry(async () => {
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
  });
}

/**
 * Fetch token holders with pagination
 * Loops through all pages, then slices to MAX_ATP_CHECK limit
 */
export async function getTokenHolders(
  tokenAddress: string,
  chain: string = "0x1", // Default to Ethereum mainnet (chain ID as hex string)
): Promise<TokenHolder[]> {
  const allHolders: TokenHolder[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 0;

  try {
    while (true) {
      pageCount++;
      console.log(
        `Fetching token holders page ${pageCount}${
          cursor ? ` (cursor: ${cursor.substring(0, 20)}...)` : ""
        }...`,
      );

      const { owners, cursor: nextCursor } = await fetchTokenOwnersPage(
        tokenAddress,
        chain,
        cursor,
      );

      allHolders.push(...owners);
      console.log(
        `Page ${pageCount}: Fetched ${owners.length} holders (total: ${allHolders.length})`,
      );

      // Stop if no more pages or if we have enough holders
      if (!nextCursor || allHolders.length >= MAX_ATP_CHECK) {
        break;
      }

      cursor = nextCursor;

      // Small delay between pages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Slice to limit at the end
    const limited = allHolders.slice(0, MAX_ATP_CHECK);
    console.log(
      `Finished fetching token holders: ${allHolders.length} total, returning ${limited.length} (limited to ${MAX_ATP_CHECK})`,
    );

    return limited;
  } catch (error) {
    console.error("Error in getTokenHolders:", error);
    // Return what we have so far, sliced to limit
    if (allHolders.length > 0) {
      console.warn(
        `Returning partial results: ${allHolders.length} holders fetched before error`,
      );
      return allHolders.slice(0, MAX_ATP_CHECK);
    }
    throw error;
  }
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
