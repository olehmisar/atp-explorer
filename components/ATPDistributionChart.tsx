import { ATPData, TokenHolder } from "@/types/atp";
import { useState } from "react";
import { formatUnits } from "viem";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ATPDistributionChartProps {
  atps: ATPData[];
  tokenHolders?: TokenHolder[];
}

const DECIMALS = 18;

function formatBinLabel(low: number, high: number | null): string {
  const fmt = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
    if (v >= 1) return v.toFixed(2);
    if (v >= 0.01) return v.toFixed(4);
    return v.toExponential(2);
  };
  if (high === null) return `>${fmt(low)}`;
  if (low === 0) return `0–${fmt(high)}`;
  return `${fmt(low)}–${fmt(high)}`;
}

function formatAZTEC(value: number): string {
  if (value === 0) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(4);
}

const BIN_EDGES = [
  0,
  200_000, // 0–200k (combines 0–10k, 10k–50k, 50k–100k, 100k–200k)
  500_000,
  1_000_000,
  5_000_000,
  10_000_000,
  Infinity,
];

export default function ATPDistributionChart({
  atps,
  tokenHolders = [],
}: ATPDistributionChartProps) {
  const [includeNonATPHolders, setIncludeNonATPHolders] = useState(false);

  const atpAmounts = atps
    .map((a) => parseFloat(formatUnits(BigInt(a.allocation), DECIMALS)))
    .filter((n) => n > 0);

  const nonATPHolderAmounts = includeNonATPHolders
    ? tokenHolders
        .filter((h) => h.type !== "atp")
        .map((h) => parseFloat(formatUnits(BigInt(h.balance), DECIMALS)))
        .filter((n) => n > 0)
    : [];

  const amounts = [...atpAmounts, ...nonATPHolderAmounts];

  if (amounts.length === 0) {
    return (
      <div className="bg-[#2A2410] shadow-lg p-6 border border-[#3A3420]">
        <h2 className="text-xl font-light text-chartreuse">
          Token Distribution
        </h2>
        <p className="text-[#948F80] mt-2">No allocation data available</p>
      </div>
    );
  }

  // Exclusive bins: 0–200k, 200k–500k, 500k–1m, 1m–5m, 5m–10m, >10m
  const chartData: {
    low: number;
    high: number | null;
    label: string;
    count: number;
    totalAZTEC: number;
    totalAZTECFormatted: string;
  }[] = [];

  for (let i = 0; i < BIN_EDGES.length - 1; i++) {
    const low = BIN_EDGES[i]!;
    const high = BIN_EDGES[i + 1]!;

    const inBin = amounts.filter((a) => {
      if (high === Infinity) return a > low;
      return a > low && a <= high;
    });
    const totalAZTEC = inBin.reduce((sum, a) => sum + a, 0);

    chartData.push({
      low,
      high: high === Infinity ? null : high,
      label: formatBinLabel(low, high === Infinity ? null : high),
      count: inBin.length,
      totalAZTEC,
      totalAZTECFormatted: formatAZTEC(totalAZTEC),
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#2A2410] p-3 border border-[#3A3420] shadow-lg">
          <p className="font-semibold text-aqua">{d.label} AZTEC</p>
          <p className="text-sm text-[#B4B0A0]">
            {d.count} {countLabel} in this bin
          </p>
          <p className="text-sm text-[#B4B0A0]">
            Total: {d.totalAZTECFormatted} AZTEC
          </p>
        </div>
      );
    }
    return null;
  };

  const countLabel = includeNonATPHolders ? "Holders" : "ATPs";

  return (
    <div className="bg-[#2A2410] shadow-lg p-6 border border-[#3A3420]">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-light text-chartreuse">
            Token Distribution
          </h2>
          <p className="text-sm text-[#948F80] mt-1">
            {includeNonATPHolders
              ? "ATPs + direct holders and AZTEC per allocation range"
              : "ATPs and AZTEC per allocation range"}
          </p>
        </div>
        {tokenHolders.length > 0 && (
          <button
            type="button"
            onClick={() => setIncludeNonATPHolders((v) => !v)}
            className={`px-5 py-3 font-medium border-2 transition-colors ${
              includeNonATPHolders
                ? "bg-chartreuse text-lapis border-chartreuse"
                : "bg-transparent text-chartreuse border-chartreuse hover:bg-chartreuse/20"
            }`}
          >
            Include non-ATP holders
            {includeNonATPHolders && " ✓"}
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-[#3A3420]"
            strokeOpacity={0.3}
            horizontal={false}
          />
          <XAxis
            type="number"
            dataKey="count"
            xAxisId="count"
            orientation="bottom"
            tick={{ fill: "#D4FF28" }}
            tickFormatter={(v) => v.toLocaleString()}
            className="text-xs"
          />
          <XAxis
            type="number"
            dataKey="totalAZTEC"
            xAxisId="total"
            orientation="top"
            tick={{ fill: "#FF2DF4" }}
            tickFormatter={(v) => formatAZTEC(v)}
            className="text-xs"
          />
          <YAxis
            type="category"
            dataKey="label"
            width={70}
            tick={{ fill: "#D4FF28", fontSize: 12 }}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#D4FF28" }}
            formatter={(value) => <span className="text-aqua">{value}</span>}
          />
          <Bar
            dataKey="count"
            xAxisId="count"
            fill="#2BFAE9"
            radius={[0, 4, 4, 0]}
            name={countLabel}
          />
          <Bar
            dataKey="totalAZTEC"
            xAxisId="total"
            fill="#FF2DF4"
            radius={[0, 4, 4, 0]}
            name="Total AZTEC"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
