import { ATPData } from "@/types/atp";
import { generateUnlockPoints } from "@/lib/unlock-calculator";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatTokenAmount } from "@/lib/utils";
import { format } from "date-fns";

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Unlock Schedule
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No lock data available
        </p>
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
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-semibold">{format(new Date(data.time), "PPpp")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Unlocked: {data.unlocked} AZTEC
          </p>
        </div>
      );
    }
    return null;
  };

  // Add vertical line for current time
  const currentDataPoint = chartData.find((d) => d.time >= now) || chartData[chartData.length - 1];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Cumulative Unlock Schedule
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Cumulative AZTEC tokens unlocked over time across all ATPs
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[startTime, endTime]}
            tickFormatter={(value) => format(new Date(value), "MMM yyyy")}
            className="text-xs"
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="unlockedRaw"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Unlocked AZTEC"
            yAxisId={0}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Current time: {format(new Date(now), "PPpp")}</p>
      </div>
    </div>
  );
}
