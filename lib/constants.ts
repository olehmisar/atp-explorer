// AZTEC token contract address on Ethereum mainnet
export const AZTEC_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_AZTEC_TOKEN_ADDRESS ||
  "0xa27ec0006e59f245217ff08cd52a7e8b169e62d2";

// Known address names for display in UI
// All addresses are normalized to lowercase for matching
export const ADDRESS_NAMES: Record<string, string> = {
  "0x603bb2c05d474794ea97805e8de69bccfb3bca12": "Aztec Rollup",
  "0x1102471eb3378fee427121c9efcea452e4b6b75e": "Aztec Governance",
  "0x662de311f94bdbb571d95b5909e9cc6a25a6802a": "Aztec Treasury",
  "0x13620833364653fa125ccdd7cf54b9e4a22ab6d9": "Aztec Foundation",
  "0x92ba0fd39658105fac4df2b9bade998b5816b350": "Aztec Labs",
  "0x3d6a1b00c830c5f278fc5dfb3f6ff0b74db6dfe0": "Aztec Rewards Distributor",
  "0x4b00c30ceba3f188407c6e6741cc5b43561f1f6e": "Aztec Token Sale",
  "0x000000000004444c5dc75cb358380d2e3de08a90": "Uniswap V4",
};

// Default number of addresses to check for ATP contracts
const DEFAULT_MAX_ATP_CHECK = 99999999;

// Maximum number of addresses to check for ATP contracts (from env or default)
export const MAX_ATP_CHECK = parseInt(
  process.env.MAX_ATP_CHECK || String(DEFAULT_MAX_ATP_CHECK),
  10,
);
