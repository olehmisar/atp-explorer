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
        <span className="px-2 py-0.5 text-xs font-semibold bg-lapis/30 text-aqua">
          ATP
        </span>
      );
    case "contract":
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-[#3A3420] text-[#B4B0A0]">
          Contract
        </span>
      );
    default:
      return (
        <span className="px-2 py-0.5 text-xs font-semibold bg-malachite/30 text-aqua">
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
    <div className="bg-[#2A2410]">
      <h2 className="text-xl font-light text-chartreuse">Top Token Holders</h2>
      {sortedHolders.length === 0 ? (
        <p className="text-[#948F80]">No token holders found</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedHolders.slice(0, 100).map((holder, index) => (
            <div
              key={holder.address}
              className="flex items-center justify-between p-3 bg-[#3A3420]"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8  bg-gradient-to-br from-lapis to-aubergine flex items-center justify-center text-aqua font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://etherscan.io/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-chartreuse hover:underline"
                    >
                      {formatAddress(holder.address)}
                    </a>
                    {holder.type === "atp" && (
                      <Link
                        href={`/atp/${holder.address}`}
                        className="text-xs text-chartreuse hover:underline"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                  {getHolderTypeBadge(holder.type)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-aqua">
                  {formatTokenAmount(holder.balance)}
                </div>
                <div className="text-xs text-[#948F80]">AZTEC</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
