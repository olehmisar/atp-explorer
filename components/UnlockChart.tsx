import { generateUnlockPoints } from "@/lib/unlock-calculator";
import { formatTokenAmount } from "@/lib/utils";
import { ATPData } from "@/types/atp";
import { format } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface UnlockChartProps {
  atps: ATPData[];
}

export default function UnlockChart({ atps }: UnlockChartProps) {
  // Filter ATPs with valid global locks
  const locks = atps
    .filter((atp) => atp.globalLock)
    .map((atp) => atp.globalLock!);

  if (locks.length === 0) {
    return (
      <div className="bg-[#2A2410]">
        <h2 className="text-xl font-light text-chartreuse">Unlock Schedule</h2>
        <p className="text-[#948F80]">No lock data available</p>
      </div>
    );
  }

  // Calculate time range
  // All timestamps are now in milliseconds
  const now = Date.now(); // Current time in milliseconds
  const minStartTime = Math.min(...locks.map((lock) => Number(lock.startTime)));
  const maxEndTime = Math.max(
    ...locks.map(
      (lock) =>
        Number(lock.startTime) +
        Number(lock.cliffDuration) +
        Number(lock.lockDuration),
    ),
  );

  // Extend range a bit for better visualization
  const startTime = Math.min(minStartTime, now) - 86400 * 30 * 1000; // 30 days before (in ms)
  const endTime = Math.max(maxEndTime, now) + 86400 * 365 * 1000; // 1 year after (in ms)

  // Generate unlock points
  const unlockPoints = generateUnlockPoints(locks, startTime, endTime, 200);

  // Format data for chart
  const chartData = unlockPoints.map((point) => ({
    time: point.timestamp, // Already in milliseconds
    timestamp: point.timestamp,
    unlocked: formatTokenAmount(point.unlocked),
    unlockedRaw: Number(point.unlocked) / 1e18, // Convert to number for chart (assuming 18 decimals)
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#2A2410]">
          <p className="font-semibold text-aqua">
            {format(new Date(data.time), "PPpp")}
          </p>
          <p className="text-sm text-[#B4B0A0]">
            Unlocked: {data.unlocked} AZTEC
          </p>
        </div>
      );
    }
    return null;
  };

  // Add vertical line for current time
  const currentDataPoint =
    chartData.find((d) => d.time >= now) || chartData[chartData.length - 1];

  return (
    <div className="bg-[#2A2410] shadow-lg p-6 border border-[#3A3420]">
      <h2 className="text-xl font-light text-chartreuse mb-4">
        Cumulative Unlock Schedule
      </h2>
      <p className="text-sm text-[#948F80] mb-4">
        Cumulative AZTEC tokens unlocked over time across all ATPs
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-[#3A3420]"
            strokeOpacity={0.3}
          />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[startTime, endTime]}
            tickFormatter={(value) => format(new Date(value), "MMM yyyy")}
            className="text-xs"
            tick={{ fill: "#D4FF28" }}
          />
          <YAxis
            tickFormatter={(value) => {
              const num = value as number;
              if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
              if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
              if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
              return num.toFixed(2);
            }}
            className="text-xs"
            tick={{ fill: "#D4FF28" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#D4FF28" }}
            formatter={(value) => <span className="text-aqua">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="unlockedRaw"
            stroke="#2BFAE9"
            strokeWidth={2}
            dot={false}
            name="Unlocked AZTEC"
            yAxisId={0}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-[#948F80]">
        <p>Current time: {format(new Date(now), "PPpp")}</p>
      </div>
    </div>
  );
}
