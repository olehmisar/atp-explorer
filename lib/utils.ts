import { formatUnits } from "viem";
import { ADDRESS_NAMES } from "./constants";

/**
 * Format a token amount from wei to a human-readable string
 * @param amount - Amount in wei (as string or bigint)
 * @param decimals - Token decimals (default: 18)
 * @returns Formatted string (e.g., "1.5M", "2.3K", "100.5")
 */
export function formatTokenAmount(
  amount: string | bigint,
  decimals: number = 18,
): string {
  try {
    const amountBigInt = typeof amount === "string" ? BigInt(amount) : amount;
    const formatted = formatUnits(amountBigInt, decimals);
    const num = parseFloat(formatted);

    if (num === 0) return "0";
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(4);
  } catch {
    return "0";
  }
}

/**
 * Get display name for an address, or return null if not found
 */
export function getAddressName(address: string): string | null {
  if (!address) return null;
  const normalized = address.toLowerCase();
  return ADDRESS_NAMES[normalized] || ADDRESS_NAMES[address] || null;
}

/**
 * Format address for display - shows "Name (address)" if name exists, otherwise just "address"
 */
export function formatAddress(address: string): string {
  if (!address) return "";
  const name = getAddressName(address);
  if (name) {
    return `${name} (${truncateAddress(address)})`;
  }
  return truncateAddress(address);
}

/**
 * Truncate an Ethereum address for display
 * @param address - Full Ethereum address
 * @param start - Number of characters to show at start (default: 6)
 * @param end - Number of characters to show at end (default: 4)
 * @returns Truncated address (e.g., "0x1234...5678")
 */
export function truncateAddress(
  address: string,
  start: number = 6,
  end: number = 4,
): string {
  if (!address || address.length < start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}
