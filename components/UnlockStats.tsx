import { ATPData } from "@/types/atp";
import { calculateUnlockStats } from "@/lib/unlock-calculator";
import { formatTokenAmount } from "@/lib/utils";

interface UnlockStatsProps {
  atps: ATPData[];
}

export default function UnlockStats({ atps }: UnlockStatsProps) {
  const locks = atps
    .filter((atp) => atp.globalLock)
    .map((atp) => atp.globalLock!);

  if (locks.length === 0) {
    return null;
  }

  const stats = calculateUnlockStats(locks);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Unlock Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Locked</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTokenAmount(stats.totalLocked)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">AZTEC</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Unlocked</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatTokenAmount(stats.totalUnlocked)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {stats.unlockPercentage}% of total
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Fully Unlocked</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalFullyUnlocked}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">ATPs</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Cliff Period</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.totalInCliff}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">ATPs</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unlocking</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalUnlocking}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">ATPs</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Unlock Progress</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.unlockPercentage}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">of total locked</div>
        </div>
      </div>
    </div>
  );
}

