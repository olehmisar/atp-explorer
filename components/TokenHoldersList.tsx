"use client";

import { formatAddress, formatTokenAmount } from "@/lib/utils";
import { HolderType, TokenHolder } from "@/types/atp";
import Link from "next/link";

interface TokenHoldersListProps {
  holders: TokenHolder[];
}

function getHolderTypeBadge(type?: HolderType) {
  switch (type) {
    case "atp":
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          ATP
        </span>
      );
    case "contract":
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          Contract
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          User
        </span>
      );
  }
}

export default function TokenHoldersList({ holders }: TokenHoldersListProps) {
  // Sort holders by balance (descending)
  const sortedHolders = [...holders].sort((a, b) => {
    try {
      return BigInt(b.balance) > BigInt(a.balance) ? 1 : -1;
    } catch {
      return 0;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Top Token Holders
      </h2>
      {sortedHolders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No token holders found
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedHolders.slice(0, 100).map((holder, index) => (
            <div
              key={holder.address}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://etherscan.io/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {formatAddress(holder.address)}
                    </a>
                    {holder.type === "atp" && (
                      <Link
                        href={`/atp/${holder.address}`}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                  {getHolderTypeBadge(holder.type)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatTokenAmount(holder.balance)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  AZTEC
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
