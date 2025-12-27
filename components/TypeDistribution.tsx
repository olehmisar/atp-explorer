import { ATPStats, ATPType } from '@/types/atp';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatTokenAmount } from '@/lib/utils';

interface TypeDistributionProps {
  stats: ATPStats;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

export default function TypeDistribution({ stats }: TypeDistributionProps) {
  const data = [
    {
      name: 'LATP (Linear)',
      value: stats.byType[ATPType.Linear].count,
      allocation: formatTokenAmount(stats.byType[ATPType.Linear].totalAllocation),
    },
    {
      name: 'MATP (Milestone)',
      value: stats.byType[ATPType.Milestone].count,
      allocation: formatTokenAmount(stats.byType[ATPType.Milestone].totalAllocation),
    },
    {
      name: 'NCATP (Non-Claim)',
      value: stats.byType[ATPType.NonClaim].count,
      allocation: formatTokenAmount(stats.byType[ATPType.NonClaim].totalAllocation),
    },
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Count: {payload[0].value}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Allocation: {payload[0].payload.allocation} AZTEC
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ATP Type Distribution
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No ATP data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        ATP Type Distribution
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {item.value} ATPs ({item.allocation} AZTEC)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
