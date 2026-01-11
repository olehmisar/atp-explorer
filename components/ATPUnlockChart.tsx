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
  size?: "small" | "large";
}

function ATPUnlockChart({ atp, size = "small" }: ATPUnlockChartProps) {
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

  const isLarge = size === "large";
  const containerClass = isLarge ? "w-full max-w-4xl" : "w-64";
  const height = isLarge ? 400 : 120;
  const margin = isLarge
    ? { top: 10, right: 20, bottom: 30, left: 60 }
    : { top: 5, right: 5, bottom: 5, left: 50 };

  if (!atp.globalLock || !chartData) {
    return (
      <div className={`${containerClass} text-center text-xs text-[#948F80]`}>
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
        <div className="bg-[#2A2410] p-2 border border-[#3A3420] shadow-lg text-xs">
          <p className="font-semibold text-aqua">
            {format(new Date(data.time), "MMM yyyy")}
          </p>
          <p className="text-[#B4B0A0]">Unlocked: {data.unlocked} AZTEC</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={containerClass}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={margin}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-[#3A3420]"
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
            tick={{ fill: "#D4FF28" }}
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
            width={60}
            tickCount={4}
            tick={{ fill: "#D4FF28" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="unlockedRaw"
            stroke="#2BFAE9"
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
