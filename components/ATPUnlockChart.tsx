import { generateUnlockPoints } from "@/lib/unlock-calculator";
import { formatTokenAmount } from "@/lib/utils";
import { ATPData } from "@/types/atp";
import { format } from "date-fns";
import { memo, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ATPUnlockChartProps {
  atp: ATPData;
}

function ATPUnlockChart({ atp }: ATPUnlockChartProps) {
  // Memoize chart data calculation
  const chartData = useMemo(() => {
    if (!atp.globalLock) {
      return null;
    }

    // Calculate time range for this ATP
    const now = Date.now(); // Current time in milliseconds
    const startTime = Number(atp.globalLock.startTime);
    // lockDuration is the total duration from startTime to endTime
    const endTime = startTime + Number(atp.globalLock.lockDuration);

    // Extend range a bit for better visualization
    const chartStartTime = Math.min(startTime, now) - 86400 * 30 * 1000; // 30 days before (in ms)
    const chartEndTime = Math.max(endTime, now) + 86400 * 90 * 1000; // 90 days after (in ms)

    // Generate unlock points with fewer points for better performance (30 instead of 100)
    const unlockPoints = generateUnlockPoints(
      [atp.globalLock],
      chartStartTime,
      chartEndTime,
      30, // Reduced from 100 to 30 for better performance
    );

    // Format data for chart
    return unlockPoints.map((point) => ({
      time: point.timestamp, // Already in milliseconds
      timestamp: point.timestamp,
      unlocked: formatTokenAmount(point.unlocked),
      unlockedRaw: Number(point.unlocked) / 1e18, // Convert to number for chart (assuming 18 decimals)
    }));
  }, [atp.globalLock]);

  if (!atp.globalLock || !chartData) {
    return (
      <div className="w-64 text-center text-xs text-gray-500 dark:text-gray-400">
        No lock data
      </div>
    );
  }

  // Memoize time domain
  const timeDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return [0, 0];
    const times = chartData.map((d) => d.time);
    return [Math.min(...times), Math.max(...times)];
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-lg text-xs">
          <p className="font-semibold">
            {format(new Date(data.time), "MMM yyyy")}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Unlocked: {data.unlocked} AZTEC
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-64">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-gray-300 dark:stroke-gray-700"
            strokeOpacity={0.3}
          />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={timeDomain}
            tickFormatter={(value) => format(new Date(value), "MMM yyyy")}
            className="text-xs"
            height={30}
            tickCount={4}
          />
          <YAxis
            tickFormatter={(value) => {
              const num = value as number;
              if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
              if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
              if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
              return num.toFixed(0);
            }}
            className="text-xs"
            width={40}
            tickCount={4}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="unlockedRaw"
            stroke="#3B82F6"
            strokeWidth={1.5}
            dot={false}
            name="Unlocked AZTEC"
            yAxisId={0}
            connectNulls={false}
            isAnimationActive={false} // Disable animation for better performance
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(ATPUnlockChart);
