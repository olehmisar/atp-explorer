// AZTEC token contract address on Ethereum mainnet
export const AZTEC_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_AZTEC_TOKEN_ADDRESS ||
  "0xa27ec0006e59f245217ff08cd52a7e8b169e62d2";

// Ethereum mainnet chain ID
export const ETHEREUM_MAINNET = "0x1";

// Moralis chain - import EvmChain from @moralisweb3/common-evm-utils and use EvmChain.ETHEREUM
// For string usage, we'll import it in the files that need it
export const MORALIS_CHAIN = "0x1"; // This is kept for backward compatibility, but use EvmChain.ETHEREUM in code

// Update this with actual ATP contract addresses if known
export const ATP_CONTRACTS = {
  LATP: process.env.NEXT_PUBLIC_LATP_ADDRESS || "",
  MATP: process.env.NEXT_PUBLIC_MATP_ADDRESS || "",
  NCATP: process.env.NEXT_PUBLIC_NCATP_ADDRESS || "",
};

// Default number of addresses to check for ATP contracts
export const DEFAULT_MAX_ATP_CHECK = 50;

// Maximum number of addresses to check for ATP contracts (from env or default)
export const MAX_ATP_CHECK = parseInt(
  process.env.MAX_ATP_CHECK || String(DEFAULT_MAX_ATP_CHECK),
  10,
);
