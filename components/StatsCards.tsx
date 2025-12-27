import { formatTokenAmount } from "@/lib/utils";
import { ATPStats } from "@/types/atp";

interface StatsCardsProps {
  stats: ATPStats;
}

const Tooltip = ({
  children,
  content,
}: {
  children: React.ReactNode;
  content: string;
}) => {
  return (
    <div className="flex items-center gap-1 cursor-help" title={content}>
      {children}
      <svg
        className="w-3 h-3 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
};

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total ATPs",
      value: stats.totalATPs.toString(),
      subtitle: "Active positions",
      color: "blue",
      tooltip: "Total number of active Aztec Token Positions (ATPs) found",
    },
    {
      title: "Total Allocation",
      value: formatTokenAmount(stats.totalAllocation),
      subtitle: "AZTEC tokens",
      color: "green",
      tooltip: "Sum of all tokens allocated across all ATP contracts",
    },
    {
      title: "Total Claimed",
      value: formatTokenAmount(stats.totalClaimed),
      subtitle: "AZTEC tokens",
      color: "purple",
      tooltip:
        "Total amount of tokens that have been claimed from ATP contracts",
    },
    {
      title: "Total Claimable",
      value: formatTokenAmount(stats.totalClaimable),
      subtitle: "AZTEC tokens",
      color: "orange",
      tooltip:
        "Total amount of tokens currently available to be claimed based on unlock schedules",
    },
    {
      title: "Total Balance",
      value: formatTokenAmount(stats.totalBalance),
      subtitle: "AZTEC tokens",
      color: "indigo",
      tooltip:
        "Total balance across all ATP contracts. May be lower than allocation because tokens may be staked",
    },
    {
      title: "Token Holders",
      value: stats.tokenHolders.total.toString(),
      subtitle: "Unique addresses",
      color: "pink",
      tooltip: "Total number of unique addresses that hold AZTEC tokens",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-500 dark:bg-blue-600",
    green: "bg-green-500 dark:bg-green-600",
    purple: "bg-purple-500 dark:bg-purple-600",
    orange: "bg-orange-500 dark:bg-orange-600",
    indigo: "bg-indigo-500 dark:bg-indigo-600",
    pink: "bg-pink-500 dark:bg-pink-600",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Tooltip content={card.tooltip}>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </h3>
            </Tooltip>
            <div
              className={`w-3 h-3 rounded-full ${
                colorClasses[card.color as keyof typeof colorClasses]
              }`}
            ></div>
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
