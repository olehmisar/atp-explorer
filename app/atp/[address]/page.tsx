"use client";

import ATPUnlockChart from "@/components/ATPUnlockChart";
import { useATPStats } from "@/hooks/useATPStats";
import { calculateUnlockSchedule } from "@/lib/unlock-calculator";
import { formatAddress, formatTokenAmount } from "@/lib/utils";
import { ATPType } from "@/types/atp";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";

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

export default function ATPDetailPage() {
  const params = useParams();
  const address = params.address as string;

  const { data, isLoading: loading, error } = useATPStats();

  // Find the specific ATP from the loaded data
  const atp = data?.atps?.find(
    (a) => a.address.toLowerCase() === address.toLowerCase(),
  );

  // Calculate unlock schedule if not present
  const atpWithSchedule = atp
    ? {
        ...atp,
        unlockSchedule: atp.unlockSchedule
          ? atp.unlockSchedule
          : atp.globalLock
          ? calculateUnlockSchedule(atp.globalLock)
          : undefined,
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading ATP data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h2 className="text-red-800 dark:text-red-200 font-semibold mb-2">
              Error
            </h2>
            <p className="text-red-600 dark:text-red-300">
              {error instanceof Error ? error.message : "Failed to load data"}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!atpWithSchedule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h2 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
              ATP Not Found
            </h2>
            <p className="text-yellow-600 dark:text-yellow-300">
              No ATP found with address: {formatAddress(address)}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ATP Details
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Address: <span className="font-mono">{formatAddress(address)}</span>
          </p>
        </header>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          {/* Type & Status */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Type & Status
            </h2>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-3 py-1.5 text-sm font-semibold rounded-full ${getTypeBadgeColor(
                  atpWithSchedule.type,
                )}`}
              >
                {atpWithSchedule.type}
              </span>
              {atpWithSchedule.isRevoked && (
                <span className="px-3 py-1.5 text-sm font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  Revoked
                </span>
              )}
              {atpWithSchedule.isRevokable && !atpWithSchedule.isRevoked && (
                <span className="px-3 py-1.5 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Revokable
                </span>
              )}
              {atpWithSchedule.milestoneStatus && (
                <span
                  className={`px-3 py-1.5 text-sm font-semibold rounded-full ${
                    atpWithSchedule.milestoneStatus === "Succeeded"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : atpWithSchedule.milestoneStatus === "Failed"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  }`}
                >
                  {atpWithSchedule.milestoneStatus}
                </span>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Addresses
            </h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ATP Contract:
                </span>
                <a
                  href={`https://etherscan.io/address/${atpWithSchedule.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-mono"
                >
                  {formatAddress(atpWithSchedule.address)}
                </a>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Beneficiary:
                </span>
                <a
                  href={`https://etherscan.io/address/${atpWithSchedule.beneficiary}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-mono"
                >
                  {formatAddress(atpWithSchedule.beneficiary)}
                </a>
              </div>
              {atpWithSchedule.operator && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Operator:
                  </span>
                  <a
                    href={`https://etherscan.io/address/${atpWithSchedule.operator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-mono"
                  >
                    {formatAddress(atpWithSchedule.operator)}
                  </a>
                </div>
              )}
              {atpWithSchedule.staker && (
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Staker:
                  </span>
                  <a
                    href={`https://etherscan.io/address/${atpWithSchedule.staker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 dark:text-blue-400 hover:underline font-mono"
                  >
                    {formatAddress(atpWithSchedule.staker)}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Token Amounts */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Token Amounts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Allocation
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatTokenAmount(atpWithSchedule.allocation)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Claimed
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatTokenAmount(atpWithSchedule.claimed)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Claimable
                </div>
                <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {formatTokenAmount(atpWithSchedule.claimable)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Balance
                </div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatTokenAmount(atpWithSchedule.balance)}
                </div>
              </div>
            </div>
          </div>

          {/* Unlock Schedule */}
          {atpWithSchedule.unlockSchedule && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Unlock Schedule
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Unlocked
                  </div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatTokenAmount(
                      atpWithSchedule.unlockSchedule.currentUnlocked,
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    of {formatTokenAmount(atpWithSchedule.allocation)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Progress
                  </div>
                  <div className="text-xl font-semibold text-gray-900 dark:text-white">
                    {atpWithSchedule.unlockSchedule.fullyUnlocked
                      ? "100%"
                      : (
                          (Number(
                            atpWithSchedule.unlockSchedule.currentUnlocked,
                          ) /
                            Number(atpWithSchedule.allocation)) *
                          100
                        ).toFixed(1) + "%"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {atpWithSchedule.unlockSchedule.fullyUnlocked
                      ? "Fully Unlocked"
                      : "In Progress"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Cliff End
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(
                      new Date(
                        Math.floor(atpWithSchedule.unlockSchedule.cliffEnd),
                      ),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Full Unlock
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(
                      new Date(
                        Math.floor(atpWithSchedule.unlockSchedule.fullUnlock),
                      ),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lock Details */}
          {atpWithSchedule.globalLock && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Global Lock Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Start Time
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {format(
                      new Date(
                        Math.floor(atpWithSchedule.globalLock.startTime),
                      ),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Cliff Duration
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.floor(
                      atpWithSchedule.globalLock.cliffDuration /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Lock Duration
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.floor(
                      atpWithSchedule.globalLock.lockDuration /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Lock Amount
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatTokenAmount(atpWithSchedule.globalLock.amount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Milestone Info */}
          {atpWithSchedule.milestoneId && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Milestone Information
              </h2>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Milestone ID:
                </span>
                <span className="ml-2 font-mono text-gray-900 dark:text-white">
                  {atpWithSchedule.milestoneId}
                </span>
              </div>
            </div>
          )}

          {/* Unlock Chart */}
          {atpWithSchedule.globalLock && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Unlock Chart
              </h2>
              <div className="flex justify-center">
                <ATPUnlockChart atp={atpWithSchedule} size="large" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
