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
      return "bg-lapis/30 text-lapis";
    case ATPType.Milestone:
      return "bg-malachite/30 text-aqua";
    case ATPType.NonClaim:
      return "bg-aubergine/30 text-aqua";
    default:
      return "bg-[#3A3420] text-[#B4B0A0]";
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
      <div className="min-h-screen bg-lapis">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-2 border-aqua border-t-transparent mx-auto"></div>
              <p className="mt-4 text-[#B4B0A0]">Loading ATP data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lapis">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#3A1A1A]">
            <h2 className="text-[#FF6B6B]">Error</h2>
            <p className="text-[#FF8A8A]">
              {error instanceof Error ? error.message : "Failed to load data"}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-vermillion text-lapis rounded hover:bg-red-700"
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
      <div className="min-h-screen bg-lapis">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#3A2A1A]">
            <h2 className="text-aqua">ATP Not Found</h2>
            <p className="text-aqua">
              No ATP found with address: {formatAddress(address)}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-chartreuse text-lapis rounded hover:bg-yellow-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-lapis to-[#001A3A]">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="text-chartreuse hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-light text-chartreuse">ATP Details</h1>
          <p className="text-sm text-[#948F80]">
            Address: <span className="font-mono">{formatAddress(address)}</span>
          </p>
        </header>

        <div className="bg-[#2A2410] shadow-lg p-6 border border-[#3A3420]">
          {/* Type & Status */}
          <div className="mb-6">
            <h2 className="text-lg font-light text-chartreuse mb-3">
              Type & Status
            </h2>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-semibold w-auto ${getTypeBadgeColor(
                  atpWithSchedule.type,
                )}`}
              >
                {atpWithSchedule.type}
              </span>
              {atpWithSchedule.isRevoked && (
                <span className="inline-flex px-3 py-1.5 text-sm font-semibold bg-vermillion/30 text-[#FF6B6B] w-auto">
                  Revoked
                </span>
              )}
              {atpWithSchedule.isRevokable && !atpWithSchedule.isRevoked && (
                <span className="inline-flex px-3 py-1.5 text-sm font-semibold bg-aqua/30 text-aqua w-auto">
                  Revokable
                </span>
              )}
              {atpWithSchedule.milestoneStatus && (
                <span
                  className={`inline-flex px-3 py-1.5 text-sm font-semibold w-auto ${
                    atpWithSchedule.milestoneStatus === "Succeeded"
                      ? "bg-malachite/30 text-aqua"
                      : atpWithSchedule.milestoneStatus === "Failed"
                      ? "bg-vermillion/30 text-[#FF6B6B]"
                      : "bg-[#3A3420] text-[#B4B0A0]"
                  }`}
                >
                  {atpWithSchedule.milestoneStatus}
                </span>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="mb-6">
            <h2 className="text-lg font-light text-chartreuse">Addresses</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-[#B4B0A0]">ATP Contract:</span>
                <a
                  href={`https://etherscan.io/address/${atpWithSchedule.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-chartreuse hover:underline"
                >
                  {formatAddress(atpWithSchedule.address)}
                </a>
              </div>
              <div>
                <span className="text-sm text-[#B4B0A0]">Beneficiary:</span>
                <a
                  href={`https://etherscan.io/address/${atpWithSchedule.beneficiary}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-chartreuse hover:underline"
                >
                  {formatAddress(atpWithSchedule.beneficiary)}
                </a>
              </div>
              {atpWithSchedule.operator && (
                <div>
                  <span className="text-sm text-[#B4B0A0]">Operator:</span>
                  <a
                    href={`https://etherscan.io/address/${atpWithSchedule.operator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-chartreuse hover:underline"
                  >
                    {formatAddress(atpWithSchedule.operator)}
                  </a>
                </div>
              )}
              {atpWithSchedule.staker && (
                <div>
                  <span className="text-sm text-[#B4B0A0]">Staker:</span>
                  <a
                    href={`https://etherscan.io/address/${atpWithSchedule.staker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-chartreuse hover:underline"
                  >
                    {formatAddress(atpWithSchedule.staker)}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Token Amounts */}
          <div className="mb-6">
            <h2 className="text-lg font-light text-chartreuse">
              Token Amounts
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-[#B4B0A0]">Allocation</div>
                <div className="text-xl font-semibold text-aqua">
                  {formatTokenAmount(atpWithSchedule.allocation)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#B4B0A0]">Claimed</div>
                <div className="text-xl font-semibold text-aqua">
                  {formatTokenAmount(atpWithSchedule.claimed)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#B4B0A0]">Claimable</div>
                <div className="text-xl font-semibold text-aqua">
                  {formatTokenAmount(atpWithSchedule.claimable)}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#B4B0A0]">Balance</div>
                <div className="text-xl font-semibold text-aqua">
                  {formatTokenAmount(atpWithSchedule.balance)}
                </div>
              </div>
            </div>
          </div>

          {/* Unlock Schedule */}
          {atpWithSchedule.unlockSchedule && (
            <div className="mb-6">
              <h2 className="text-lg font-light text-chartreuse">
                Unlock Schedule
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-[#B4B0A0]">Unlocked</div>
                  <div className="text-xl font-semibold text-aqua">
                    {formatTokenAmount(
                      atpWithSchedule.unlockSchedule.currentUnlocked,
                    )}
                  </div>
                  <div className="text-xs text-[#948F80]">
                    of {formatTokenAmount(atpWithSchedule.allocation)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#B4B0A0]">Progress</div>
                  <div className="text-xl font-semibold text-aqua">
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
                  <div className="text-xs text-[#948F80]">
                    {atpWithSchedule.unlockSchedule.fullyUnlocked
                      ? "Fully Unlocked"
                      : "In Progress"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#B4B0A0]">Cliff End</div>
                  <div className="text-lg font-semibold text-aqua">
                    {format(
                      new Date(
                        Math.floor(atpWithSchedule.unlockSchedule.cliffEnd),
                      ),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#B4B0A0]">Full Unlock</div>
                  <div className="text-lg font-semibold text-aqua">
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
              <h2 className="text-lg font-light text-chartreuse">
                Global Lock Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-[#B4B0A0]">Start Time</div>
                  <div className="text-sm font-semibold text-aqua">
                    {format(
                      new Date(
                        Math.floor(atpWithSchedule.globalLock.startTime),
                      ),
                      "MMM dd, yyyy HH:mm",
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#B4B0A0]">Cliff Duration</div>
                  <div className="text-sm font-semibold text-aqua">
                    {Math.floor(
                      atpWithSchedule.globalLock.cliffDuration /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#B4B0A0]">Lock Duration</div>
                  <div className="text-sm font-semibold text-aqua">
                    {Math.floor(
                      atpWithSchedule.globalLock.lockDuration /
                        (1000 * 60 * 60 * 24),
                    )}{" "}
                    days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#B4B0A0]">Lock Amount</div>
                  <div className="text-sm font-semibold text-aqua">
                    {formatTokenAmount(atpWithSchedule.globalLock.amount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Milestone Info */}
          {atpWithSchedule.milestoneId && (
            <div className="mb-6">
              <h2 className="text-lg font-light text-chartreuse">
                Milestone Information
              </h2>
              <div>
                <span className="text-sm text-[#B4B0A0]">Milestone ID:</span>
                <span className="ml-2 font-mono text-aqua">
                  {atpWithSchedule.milestoneId}
                </span>
              </div>
            </div>
          )}

          {/* Unlock Chart */}
          {atpWithSchedule.globalLock && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-chartreuse">
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
