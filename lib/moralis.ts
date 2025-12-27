import Moralis from "moralis";

// Initialize Moralis (you'll need to set MORALIS_API_KEY in your .env file)
export async function initializeMoralis() {
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY || "",
    });
  }
}

export async function getTokenHolders(
  tokenAddress: string,
  chain: string = "0x1", // Default to Ethereum mainnet (chain ID as hex string)
) {
  await initializeMoralis();

  try {
    const response = await Moralis.EvmApi.token.getTokenOwners({
      tokenAddress: tokenAddress,
      chain: chain,
    });

    const result = response.raw();
    const owners = result.result || [];

    // Map Moralis response to our TokenHolderData format
    return owners.map((owner) => ({
      address: owner.owner_address,
      balance: owner.balance,
      balanceFormatted: owner.balance_formatted,
      tokenAddress: tokenAddress,
    }));
  } catch (error) {
    console.error("Error fetching token holders:", error);
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
