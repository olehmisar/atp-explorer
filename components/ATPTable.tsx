"use client";

import { formatAddress, formatTokenAmount } from "@/lib/utils";
import { ATPData, ATPType } from "@/types/atp";
import { format } from "date-fns";
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
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case ATPType.Milestone:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case ATPType.NonClaim:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

type SortColumn = "allocation" | null;
type SortDirection = "asc" | "desc";

export default function ATPTable({ atps }: ATPTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<ATPType>>(new Set());
  const [selectedRevokable, setSelectedRevokable] = useState<
    "revokable" | "non-revokable" | null
  >(null);
  const [minAllocation, setMinAllocation] = useState<string>("");
  const [maxAllocation, setMaxAllocation] = useState<string>("");
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

      // All filters must match (AND logic)
      return typeMatch && revokableMatch && allocationMatch;
    });
  }, [atps, selectedTypes, selectedRevokable, minAllocation, maxAllocation]);

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
    handleFilterChange();
  };

  // Check if any filters are active
  const hasActiveFilters =
    selectedTypes.size > 0 ||
    selectedRevokable !== null ||
    minAllocation !== "" ||
    maxAllocation !== "";

  if (atps.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ATP Positions
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
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
          <div
            className={`${
              compact ? "text-xs" : "text-sm"
            } text-gray-700 dark:text-gray-300`}
          >
            Showing {startIndex + 1} to {Math.min(endIndex, sortedATPs.length)}{" "}
            of {sortedATPs.length} positions
          </div>
        )}
        <div className="flex items-center gap-4">
          <label
            className={`${
              compact ? "text-xs" : "text-sm"
            } text-gray-700 dark:text-gray-300 flex items-center gap-2`}
          >
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className={`${
                compact ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
              } border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
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
        } border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600`}
      >
        Previous
      </button>
      <span
        className={`${
          compact ? "text-xs" : "text-sm"
        } text-gray-700 dark:text-gray-300`}
      >
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className={`${
          compact ? "px-2 py-1 text-xs" : "px-3 py-1 text-sm"
        } border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600`}
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                ATP Positions
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                  hasActiveFilters
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                } ${showFilterPanel ? "ring-2 ring-blue-500" : ""}`}
              >
                Filter
                {hasActiveFilters && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
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
        className={`w-full border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 ${
          showFilterPanel ? "" : "hidden"
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {/* Type filters */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Type (select multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(ATPType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleTypeFilter(type)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                        selectedTypes.has(type)
                          ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                          : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {/* Revokable filters */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Revokable Status (select one)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRevokableFilterChange("revokable")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      selectedRevokable === "revokable"
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    Revokable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokableFilterChange("non-revokable")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      selectedRevokable === "non-revokable"
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                        : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    Non-Revokable
                  </button>
                </div>
              </div>
              {/* Allocation filters */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Allocation Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Min"
                    value={minAllocation}
                    onChange={(e) => handleMinAllocationChange(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    to
                  </span>
                  <input
                    type="text"
                    placeholder="Max"
                    value={maxAllocation}
                    onChange={(e) => handleMaxAllocationChange(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter values in AZTEC tokens (18 decimals, e.g., 1 for 1
                  token)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50"
              >
                <Tooltip content="ATP contract address and beneficiary address">
                  Addresses
                </Tooltip>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50 w-32"
              >
                <Tooltip content="ATP type: Linear (LATP), Milestone (MATP), or Non-Claim (NCATP). Status: Revoked, Revokable, or Milestone status (Pending/Succeeded/Failed)">
                  Type
                </Tooltip>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50"
              >
                <button
                  onClick={() => handleSort("allocation")}
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <Tooltip content="Allocation: Total tokens allocated. Claimed: Already claimed tokens. Claimable: Currently claimable tokens. Balance: Current contract balance">
                    AMOUNT
                  </Tooltip>
                  {sortColumn === "allocation" && (
                    <span className="text-gray-400 dark:text-gray-500">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </button>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-700/50"
              >
                <Tooltip content="Unlock status: Current unlocked amount, progress percentage, and full unlock date">
                  Unlock
                </Tooltip>
              </th>
              <th
                style={{ position: "sticky", top: 0 }}
                className="z-10 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64 bg-gray-50 dark:bg-gray-700/50"
              >
                <Tooltip content="Visual chart showing the unlock schedule over time">
                  Chart
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedATPs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                >
                  No ATP positions match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedATPs.map((atp) => (
                <tr
                  key={atp.address}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ATP:
                        </span>
                        <a
                          href={`https://etherscan.io/address/${atp.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {formatAddress(atp.address)}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Beneficiary:
                        </span>
                        <a
                          href={`https://etherscan.io/address/${atp.beneficiary}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {formatAddress(atp.beneficiary)}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm w-32">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-semibold rounded-full w-fit ${getTypeBadgeColor(
                          atp.type,
                        )}`}
                      >
                        {atp.type}
                      </span>
                      <div className="flex flex-col space-y-1">
                        {atp.isRevoked && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 w-fit">
                            Revoked
                          </span>
                        )}
                        {atp.isRevokable && !atp.isRevoked && (
                          <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 w-fit">
                            Revokable
                          </span>
                        )}
                        {atp.milestoneStatus && (
                          <span
                            className={`px-1.5 py-0.5 text-xs font-semibold rounded-full w-fit ${
                              atp.milestoneStatus === "Succeeded"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : atp.milestoneStatus === "Failed"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {atp.milestoneStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Alloc:
                        </span>
                        <span>{formatTokenAmount(atp.allocation)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Claimed:
                        </span>
                        <span>{formatTokenAmount(atp.claimed)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Claimable:
                        </span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatTokenAmount(atp.claimable)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Balance:
                        </span>
                        <span>{formatTokenAmount(atp.balance)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {atp.unlockSchedule ? (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Unlocked:
                          </span>
                          <span>
                            {formatTokenAmount(
                              atp.unlockSchedule.currentUnlocked,
                            )}{" "}
                            / {formatTokenAmount(atp.allocation)}
                          </span>
                        </div>
                        {atp.unlockSchedule.fullyUnlocked ? (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Fully Unlocked
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Progress:
                            </span>
                            <span className="text-xs">
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
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Full unlock:
                          </span>
                          <span className="text-xs">
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
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <TableNavigation showCount />
        </div>
      )}
    </div>
  );
}
