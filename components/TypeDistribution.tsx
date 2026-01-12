import { formatTokenAmount } from "@/lib/utils";
import { ATPStats, ATPType } from "@/types/atp";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface TypeDistributionProps {
  stats: ATPStats;
}

// Use brighter, more distinct Aztec brand colors for better contrast
const COLORS = ["#2BFAE9", "#D4FF28", "#FF2DF4"]; // Aqua, Chartreuse, Orchid

// Custom label renderer for better readability - will be created inside component to access state

export default function TypeDistribution({ stats }: TypeDistributionProps) {
  // Custom label renderer for better readability
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={400}
        stroke="#1A1400"
        strokeWidth={2}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const data = [
    {
      name: "LATP (Linear)",
      value: stats.byType[ATPType.Linear].count,
      allocation: formatTokenAmount(
        stats.byType[ATPType.Linear].totalAllocation,
      ),
    },
    {
      name: "MATP (Milestone)",
      value: stats.byType[ATPType.Milestone].count,
      allocation: formatTokenAmount(
        stats.byType[ATPType.Milestone].totalAllocation,
      ),
    },
    {
      name: "NCATP (Non-Claim)",
      value: stats.byType[ATPType.NonClaim].count,
      allocation: formatTokenAmount(
        stats.byType[ATPType.NonClaim].totalAllocation,
      ),
    },
  ].filter((item) => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#2A2410] p-3 border border-[#3A3420] shadow-lg">
          <p className="font-semibold text-aqua">{payload[0].name}</p>
          <p className="text-sm text-[#B4B0A0]">Count: {payload[0].value}</p>
          <p className="text-sm text-[#B4B0A0]">
            Allocation: {payload[0].payload.allocation} AZTEC
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-[#2A2410]">
        <h2 className="text-xl font-light text-chartreuse">
          ATP Type Distribution
        </h2>
        <p className="text-[#948F80]">No ATP data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2A2410]">
      <h2 className="text-xl font-light text-chartreuse">
        ATP Type Distribution
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: "#D4FF28" }}
            formatter={(value) => <span className="text-aqua">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center text-sm"
          >
            <span className="text-[#B4B0A0]">{item.name}</span>
            <span className="font-medium text-aqua">
              {item.value} ATPs ({item.allocation} AZTEC)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
