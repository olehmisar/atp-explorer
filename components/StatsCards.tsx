import { ATPStats } from '@/types/atp';
import { formatTokenAmount } from '@/lib/utils';

interface StatsCardsProps {
  stats: ATPStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total ATPs',
      value: stats.totalATPs.toString(),
      subtitle: 'Active positions',
      color: 'blue',
    },
    {
      title: 'Total Allocation',
      value: formatTokenAmount(stats.totalAllocation),
      subtitle: 'AZTEC tokens',
      color: 'green',
    },
    {
      title: 'Total Claimed',
      value: formatTokenAmount(stats.totalClaimed),
      subtitle: 'AZTEC tokens',
      color: 'purple',
    },
    {
      title: 'Total Claimable',
      value: formatTokenAmount(stats.totalClaimable),
      subtitle: 'AZTEC tokens',
      color: 'orange',
    },
    {
      title: 'Total Balance',
      value: formatTokenAmount(stats.totalBalance),
      subtitle: 'AZTEC tokens',
      color: 'indigo',
    },
    {
      title: 'Token Holders',
      value: stats.tokenHolders.total.toString(),
      subtitle: 'Unique addresses',
      color: 'pink',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-500 dark:bg-blue-600',
    green: 'bg-green-500 dark:bg-green-600',
    purple: 'bg-purple-500 dark:bg-purple-600',
    orange: 'bg-orange-500 dark:bg-orange-600',
    indigo: 'bg-indigo-500 dark:bg-indigo-600',
    pink: 'bg-pink-500 dark:bg-pink-600',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {card.title}
            </h3>
            <div className={`w-3 h-3 rounded-full ${colorClasses[card.color as keyof typeof colorClasses]}`}></div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {card.value}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {card.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
