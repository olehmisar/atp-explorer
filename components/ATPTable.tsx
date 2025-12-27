"use client";

import { formatAddress, formatTokenAmount } from "@/lib/utils";
import { ATPData, ATPType } from "@/types/atp";
import { format } from "date-fns";
import ATPUnlockChart from "./ATPUnlockChart";

interface ATPTableProps {
  atps: ATPData[];
}

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

export default function ATPTable({ atps }: ATPTableProps) {
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          ATP Positions
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {atps.length} position{atps.length !== 1 ? "s" : ""} found
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Beneficiary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Allocation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Claimed
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Claimable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Unlock Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Full Unlock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64">
                Chart
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {atps.map((atp) => (
              <tr
                key={atp.address}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://etherscan.io/address/${atp.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {formatAddress(atp.address)}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(
                      atp.type,
                    )}`}
                  >
                    {atp.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={`https://etherscan.io/address/${atp.beneficiary}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {formatAddress(atp.beneficiary)}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatTokenAmount(atp.allocation)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatTokenAmount(atp.claimed)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatTokenAmount(atp.claimable)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatTokenAmount(atp.balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {atp.unlockSchedule ? (
                    <div className="flex flex-col space-y-1">
                      <span className="text-gray-900 dark:text-white">
                        {formatTokenAmount(atp.unlockSchedule.currentUnlocked)}{" "}
                        / {formatTokenAmount(atp.allocation)}
                      </span>
                      {atp.unlockSchedule.fullyUnlocked ? (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Fully Unlocked
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {(
                            (Number(atp.unlockSchedule.currentUnlocked) /
                              Number(atp.allocation)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {atp.unlockSchedule ? (
                    <div className="flex flex-col">
                      {/* fullUnlock is already in milliseconds */}
                      <span>
                        {format(
                          new Date(Math.floor(atp.unlockSchedule.fullUnlock)),
                          "MMM dd, yyyy",
                        )}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(
                          new Date(Math.floor(atp.unlockSchedule.fullUnlock)),
                          "HH:mm",
                        )}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    {atp.isRevoked && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Revoked
                      </span>
                    )}
                    {atp.isRevokable && !atp.isRevoked && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Revokable
                      </span>
                    )}
                    {atp.milestoneStatus && (
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                </td>
                <td className="px-6 py-4">
                  <ATPUnlockChart atp={atp} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
