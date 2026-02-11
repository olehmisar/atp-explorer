"use client";

import { formatAddress, formatTokenAmount } from "@/lib/utils";
import { ATPData, ATPType } from "@/types/atp";
import { format } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import ATPUnlockChart from "./ATPUnlockChart";

// Simple tooltip component with icon
const Tooltip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => {
  return (
    <div className="flex items-center gap-1 cursor-help" title={content}>
      {children}
      <svg
        className="w-3 h-3 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
};

interface ATPTableProps {
  atps: ATPData[];
}

const PAGE_SIZE_OPTIONS = [50, 100, 250, 500, 1000];

function getTypeBadgeColor(type: ATPType): string {
  switch (type) {
    case ATPType.Linear:
      return "bg-lapis/30 text-aqua";
    case ATPType.Milestone:
      return "bg-malachite/30 text-aqua";
    case ATPType.NonClaim:
      return "bg-aubergine/30 text-aqua";
    default:
      return "bg-[#3A3420] text-[#B4B0A0]";
  }
}

type SortColumn = "allocation" | null;
type SortDirection = "asc" | "desc";

export default function ATPTable({ atps }: ATPTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showPageSizeDropdown, setShowPageSizeDropdown] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<ATPType>>(new Set());
  const [selectedRevokable, setSelectedRevokable] = useState<
    "revokable" | "non-revokable" | null
  >(null);
  const [minAllocation, setMinAllocation] = useState<string>("");
  const [maxAllocation, setMaxAllocation] = useState<string>("");
  const [minUnlocked, setMinUnlocked] = useState<string>("");
  const [maxUnlocked, setMaxUnlocked] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("allocation");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Apply filters with AND logic between groups, OR within types
  const filteredATPs = useMemo(() => {
    return atps.filter((atp) => {
      // Type filter: OR logic - match if any selected type matches
      const typeMatch = selectedTypes.size === 0 || selectedTypes.has(atp.type);

      // Revokable filter: single selection
      const revokableMatch =
        selectedRevokable === null ||
        (selectedRevokable === "revokable" && atp.isRevokable) ||
        (selectedRevokable === "non-revokable" && !atp.isRevokable);

      // Allocation filter: min and max range (convert from tokens to wei)
      let allocationMatch = true;
      if (minAllocation !== "" || maxAllocation !== "") {
        try {
          const allocation = BigInt(atp.allocation);
          const tokenDecimals = BigInt(10 ** 18);

          // Convert token values to wei (multiply by 10^18)
          // Handle decimal input by converting to string, splitting, and padding
          const convertTokensToWei = (tokenValue: string): bigint => {
            const parts = tokenValue.split(".");
            const wholePart = parts[0] || "0";
            const decimalPart = (parts[1] || "").padEnd(18, "0").slice(0, 18);
            return BigInt(wholePart) * tokenDecimals + BigInt(decimalPart);
          };

          const minWei =
            minAllocation === "" ? null : convertTokensToWei(minAllocation);
          const maxWei =
            maxAllocation === "" ? null : convertTokensToWei(maxAllocation);

          const minMatch = minWei === null || allocation >= minWei;
          const maxMatch = maxWei === null || allocation <= maxWei;
          allocationMatch = minMatch && maxMatch;
        } catch {
          // Invalid input, skip this filter
          allocationMatch = true;
        }
      }

      // Unlocked filter: min and max range (convert from tokens to wei)
      let unlockedMatch = true;
      if (minUnlocked !== "" || maxUnlocked !== "") {
        try {
          const unlocked = atp.unlockSchedule
            ? BigInt(atp.unlockSchedule.currentUnlocked)
            : BigInt(0);
          const tokenDecimals = BigInt(10 ** 18);

          const convertTokensToWei = (tokenValue: string): bigint => {
            const parts = tokenValue.split(".");
            const wholePart = parts[0] || "0";
            const decimalPart = (parts[1] || "").padEnd(18, "0").slice(0, 18);
            return BigInt(wholePart) * tokenDecimals + BigInt(decimalPart);
          };

          const minWei =
            minUnlocked === "" ? null : convertTokensToWei(minUnlocked);
          const maxWei =
            maxUnlocked === "" ? null : convertTokensToWei(maxUnlocked);

          const minMatch = minWei === null || unlocked >= minWei;
          const maxMatch = maxWei === null || unlocked <= maxWei;
          unlockedMatch = minMatch && maxMatch;
        } catch {
          unlockedMatch = true;
        }
      }

      // All filters must match (AND logic)
      return typeMatch && revokableMatch && allocationMatch && unlockedMatch;
    });
  }, [atps, selectedTypes, selectedRevokable, minAllocation, maxAllocation, minUnlocked, maxUnlocked]);

  // Apply sorting
  const sortedATPs = useMemo(() => {
    if (!sortColumn) return filteredATPs;

    const sorted = [...filteredATPs].sort((a, b) => {
      if (sortColumn === "allocation") {
        const aVal = BigInt(a.allocation);
        const bVal = BigInt(b.allocation);
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      }
      return 0;
    });

    return sorted;
  }, [filteredATPs, sortColumn, sortDirection]);

  // Calculate pagination based on sorted and filtered results
  const totalPages = Math.ceil(sortedATPs.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedATPs = useMemo(
    () => sortedATPs.slice(startIndex, endIndex),
    [sortedATPs, startIndex, endIndex],
  );

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Handle type filter toggle (multiple selection with OR logic)
  const toggleTypeFilter = (type: ATPType) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      handleFilterChange();
      return newSet;
    });
  };

  // Handle revokable filter (single selection)
  const handleRevokableFilterChange = (
    revokable: "revokable" | "non-revokable" | null,
  ) => {
    setSelectedRevokable((prev) => {
      const newValue = prev === revokable ? null : revokable;
      handleFilterChange();
      return newValue;
    });
  };

  // Handle allocation filter changes
  const handleMinAllocationChange = (value: string) => {
    setMinAllocation(value);
    handleFilterChange();
  };

  const handleMaxAllocationChange = (value: string) => {
    setMaxAllocation(value);
    handleFilterChange();
  };

  // Handle unlocked filter changes
  const handleMinUnlockedChange = (value: string) => {
    setMinUnlocked(value);
    handleFilterChange();
  };

  const handleMaxUnlockedChange = (value: string) => {
    setMaxUnlocked(value);
    handleFilterChange();
  };

  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      // Set new column with default direction
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes(new Set());
    setSelectedRevokable(null);
    setMinAllocation("");
    setMaxAllocation("");
    setMinUnlocked("");
    setMaxUnlocked("");
    handleFilterChange();
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedTypes.size > 0 ||
    selectedRevokable !== null ||
    minAllocation !== "" ||
    maxAllocation !== "" ||
    minUnlocked !== "" ||
    maxUnlocked !== "";

  if (atps.length === 0) {
    return (
      <div className="bg-[#2A2410]">
        <h2 className="text-xl font-light text-chartreuse">ATP Positions</h2>
        <p className="text-[#948F80]">
          No ATP positions found. Connect to the blockchain to fetch ATP data.
        </p>
      </div>
    );
  }

  // Table navigation component (pagination + per page selector)
  const TableNavigation = ({
    compact = false,
    showCount = true,
  }: {
    compact?: boolean;
    showCount?: boolean;
  }) => {
    if (totalPages <= 1) return null;

    return (
      <div
        className={`flex items-center ${
          showCount ? "justify-between" : "justify-end"
        } gap-4`}
      >
        {showCount && (
          <div className={`${compact ? "text-xs" : "text-sm"} text-[#B4B0A0]`}>
            {startIndex + 1} to {Math.min(endIndex, sortedATPs.length)} of{" "}
            {sortedATPs.length}
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="relative">
            <label
              className={`${
                compact ? "text-xs" : "text-sm"
              } text-[#B4B0A0] flex items-center gap-2`}
            >
              <span>Per page:</span>
              <button
                type="button"
                onClick={() => setShowPageSizeDropdown(!showPageSizeDropdown)}
                className={`${
                  compact ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
                } border border-[#3A3420] bg-[#2A2410] text-chartreuse focus:outline-none focus:ring-2 focus:ring-chartreuse flex items-center gap-2 min-w-[80px] justify-between`}
              >
                <span>{pageSize}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showPageSizeDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </label>
            {showPageSizeDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPageSizeDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 bg-[#2A2410] border border-[#3A3420] shadow-lg min-w-[80px]">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        handlePageSizeChange(size);
                        setShowPageSizeDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-sm text-left ${
                        pageSize === size
                          ? "bg-lapis/30 text-aqua"
                          : "text-[#B4B0A0] hover:bg-[#3A3420]"
                      } transition-colors flex items-center justify-between`}
                    >
                      <span>{size}</span>
                      {pageSize === size && (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <PaginationControls compact={compact} />
        </div>
      </div>
    );
  };

  // Pagination controls component
  const PaginationControls = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className={`${
          compact ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
        } border border-[#3A3420] bg-[#2A2410] text-chartreuse disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A3420] transition-colors`}
      >
        Previous
      </button>
      <span className={`${compact ? "text-xs" : "text-sm"} text-[#B4B0A0]`}>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className={`${
          compact ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
        } border border-[#3A3420] bg-[#2A2410] text-chartreuse disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#3A3420] transition-colors`}
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="bg-[#2A2410]">
      <div className="sticky top-0 z-20 bg-[#2A2410]">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-light text-chartreuse">
                ATP Positions
              </h2>
              <p className="text-xs text-[#948F80]">
                {sortedATPs.length} of {atps.length} position
                {atps.length !== 1 ? "s" : ""} shown
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Filter button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFilterPanel((prev) => !prev);
                }}
                className={`px-4 py-2 text-sm font-medium border transition-colors text-chartreuse ${
                  hasActiveFilters ? "bg-lapis/30" : "bg-[#2A2410]"
                } ${showFilterPanel ? "ring-2 ring-chartreuse" : ""}`}
              >
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-aqua/30 text-aqua ">
                    {selectedTypes.size +
                      (selectedRevokable ? 1 : 0) +
                      (minAllocation !== "" ? 1 : 0) +
                      (maxAllocation !== "" ? 1 : 0)}
                  </span>
                )}
              </button>
              {/* Navigation in header */}
              <TableNavigation compact showCount />
            </div>
          </div>
        </div>
      </div>
      {/* Filter Panel - Moved here to ensure visibility */}
      <div
        className={`w-full border-t border-[#3A3420] bg-[#3A3420]/50 ${
          showFilterPanel ? "" : "hidden"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-chartreuse">Filters</h3>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-chartreuse hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="text-xs text-chartreuse hover:underline"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {/* Type filters */}
              <div>
                <label className="text-xs font-medium text-[#B4B0A0]">
                  Type (select multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ATPType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTypeFilter(type)}
                      className={`px-3 py-1.5 text-xs font-medium border transition-colors text-chartreuse ${
                        selectedTypes.has(type)
                          ? "bg-chartreuse/25 border-chartreuse"
                          : "bg-[#2A2410] border-[#3A3420]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {/* Revokable filters */}
              <div>
                <label className="text-xs font-medium text-[#B4B0A0]">
                  Revokable Status (select one)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRevokableFilterChange("revokable")}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors text-chartreuse ${
                      selectedRevokable === "revokable"
                        ? "bg-chartreuse/25 border-chartreuse"
                        : "bg-[#2A2410] border-[#3A3420]"
                    }`}
                  >
                    Revokable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokableFilterChange("non-revokable")}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors text-chartreuse ${
                      selectedRevokable === "non-revokable"
                        ? "bg-chartreuse/25 border-chartreuse"
                        : "bg-[#2A2410] border-[#3A3420]"
                    }`}
                  >
                    Non-Revokable
                  </button>
                </div>
              </div>
              {/* Allocation filters */}
              <div>
                <label className="text-xs font-medium text-[#B4B0A0]">
                  Allocation Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    value={minAllocation}
                    onChange={(e) => handleMinAllocationChange(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-[#3A3420] bg-[#1A1400] text-parchment"
                  />
                  <span className="text-xs text-[#948F80]">to</span>
                  <input
                    type="text"
                    placeholder="Max"
                    value={maxAllocation}
                    onChange={(e) => handleMaxAllocationChange(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-[#3A3420] bg-[#1A1400] text-parchment"
                  />
                </div>
                <p className="text-xs text-[#948F80]">
                  Enter values in AZTEC tokens (e.g., 1000000)
                </p>
              </div>
              {/* Unlocked tokens filters */}
              <div>
                <label className="text-xs font-medium text-[#B4B0A0]">
                  Unlocked Tokens Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    value={minUnlocked}
                    onChange={(e) => handleMinUnlockedChange(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-[#3A3420] bg-[#1A1400] text-parchment"
                  />
                  <span className="text-xs text-[#948F80]">to</span>
                  <input
                    type="text"
                    placeholder="Max"
                    value={maxUnlocked}
                    onChange={(e) => handleMaxUnlockedChange(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-[#3A3420] bg-[#1A1400] text-parchment"
                  />
                </div>
                <p className="text-xs text-[#948F80]">
                  Enter values in AZTEC tokens (e.g., 500000)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#3A3420]">
            <tr>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-[#948F80]"
              >
                <Tooltip content="ATP contract address and beneficiary address">
                  Addresses
                </Tooltip>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-3 py-3 text-left text-xs font-medium text-[#948F80]"
              >
                <Tooltip content="ATP type: Linear (LATP), Milestone (MATP), or Non-Claim (NCATP). Status: Revoked, Revokable, or Milestone status (Pending/Succeeded/Failed)">
                  Type
                </Tooltip>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-[#948F80]"
              >
                <button
                  onClick={() => handleSort("allocation")}
                  className="flex items-center gap-1 hover:text-chartreuse"
                >
                  <Tooltip content="Allocation: Total tokens allocated. Claimed: Already claimed tokens. Claimable: Currently claimable tokens. Balance: Current contract balance">
                    AMOUNT
                  </Tooltip>
                  {sortColumn === "allocation" && (
                    <span className="text-[#8A8470]">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-[#948F80]"
              >
                <Tooltip content="Unlock status: Current unlocked amount, progress percentage, and full unlock date">
                  Unlock
                </Tooltip>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-[#948F80]"
              >
                <Tooltip content="Visual chart showing the unlock schedule over time">
                  Chart
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#2A2410]">
            {paginatedATPs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-[#948F80]"
                >
                  No ATP positions match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedATPs.map((atp) => (
                <tr key={atp.address} className="hover:bg-[#3A3420]">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#948F80]">ATP:</span>
                        <a
                          href={`https://etherscan.io/address/${atp.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-chartreuse hover:underline"
                        >
                          {formatAddress(atp.address)}
                        </a>
                        <Link
                          href={`/atp/${atp.address}`}
                          className="ml-2 text-xs text-chartreuse hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#948F80]">
                          Beneficiary:
                        </span>
                        <a
                          href={`https://etherscan.io/address/${atp.beneficiary}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-chartreuse hover:underline"
                        >
                          {formatAddress(atp.beneficiary)}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm w-32">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold w-auto ${getTypeBadgeColor(
                          atp.type,
                        )}`}
                      >
                        {atp.type}
                      </span>
                      <div className="flex flex-col space-y-1">
                        {atp.isRevoked && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-vermillion/30 text-[#FF6B6B] w-auto">
                            Revoked
                          </span>
                        )}
                        {atp.isRevokable && !atp.isRevoked && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold bg-aqua/30 text-aqua w-auto">
                            Revokable
                          </span>
                        )}
                        {atp.milestoneStatus && (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold w-auto ${
                              atp.milestoneStatus === "Succeeded"
                                ? "bg-malachite/30 text-aqua"
                                : atp.milestoneStatus === "Failed"
                                ? "bg-vermillion/30 text-[#FF6B6B]"
                                : "bg-[#3A3420] text-[#B4B0A0]"
                            }`}
                          >
                            {atp.milestoneStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-aqua">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#948F80]">Alloc:</span>
                        <span className="text-aqua">
                          {formatTokenAmount(atp.allocation)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#948F80]">Claimed:</span>
                        <span className="text-aqua">
                          {formatTokenAmount(atp.claimed)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#948F80]">
                          Claimable:
                        </span>
                        <span className="text-aqua">
                          {formatTokenAmount(atp.claimable)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#948F80]">Balance:</span>
                        <span className="text-aqua">
                          {formatTokenAmount(atp.balance)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-aqua">
                    {atp.unlockSchedule ? (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#948F80]">
                            Unlocked:
                          </span>
                          <span className="text-aqua">
                            {formatTokenAmount(
                              atp.unlockSchedule.currentUnlocked,
                            )}{" "}
                            / {formatTokenAmount(atp.allocation)}
                          </span>
                        </div>
                        {atp.unlockSchedule.fullyUnlocked ? (
                          <span className="text-xs text-aqua">
                            Fully Unlocked
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#948F80]">
                              Progress:
                            </span>
                            <span className="text-xs text-aqua">
                              {(
                                (Number(atp.unlockSchedule.currentUnlocked) /
                                  Number(atp.allocation)) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#948F80]">
                            Full unlock:
                          </span>
                          <span className="text-xs text-aqua">
                            {format(
                              new Date(
                                Math.floor(atp.unlockSchedule.fullUnlock),
                              ),
                              "MMM dd, yyyy",
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ATPUnlockChart atp={atp} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Navigation at bottom */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <TableNavigation showCount />
        </div>
      )}
    </div>
  );
}
