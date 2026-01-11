import { calculateUnlockStats } from "@/lib/unlock-calculator";
import { formatTokenAmount } from "@/lib/utils";
import { ATPData } from "@/types/atp";

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
    <div className="bg-[#2A2410] shadow-lg p-6 border border-[#3A3420]">
      <h2 className="text-xl font-light text-chartreuse mb-4">
        Unlock Statistics
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-[#B4B0A0]">Total Locked</div>
          <div className="text-2xl font-light text-aqua">
            {formatTokenAmount(stats.totalLocked)}
          </div>
          <div className="text-xs text-[#948F80]">AZTEC</div>
        </div>
        <div>
          <div className="text-sm text-[#B4B0A0]">Total Unlocked</div>
          <div className="text-2xl font-light text-aqua">
            {formatTokenAmount(stats.totalUnlocked)}
          </div>
          <div className="text-xs text-[#948F80]">
            {stats.unlockPercentage}% of total
          </div>
        </div>
        <div>
          <div className="text-sm text-[#B4B0A0]">Fully Unlocked</div>
          <div className="text-2xl font-light text-aqua">
            {stats.totalFullyUnlocked}
          </div>
          <div className="text-xs text-[#948F80]">ATPs</div>
        </div>
        <div>
          <div className="text-sm text-[#B4B0A0]">In Cliff Period</div>
          <div className="text-2xl font-light text-aqua">
            {stats.totalInCliff}
          </div>
          <div className="text-xs text-[#948F80]">ATPs</div>
        </div>
        <div>
          <div className="text-sm text-[#B4B0A0]">Unlocking</div>
          <div className="text-2xl font-light text-aqua">
            {stats.totalUnlocking}
          </div>
          <div className="text-xs text-[#948F80]">ATPs</div>
        </div>
        <div>
          <div className="text-sm text-[#B4B0A0]">Unlock Progress</div>
          <div className="text-2xl font-light text-aqua">
            {stats.unlockPercentage}%
          </div>
          <div className="text-xs text-[#948F80]">of total locked</div>
        </div>
      </div>
    </div>
  );
}
