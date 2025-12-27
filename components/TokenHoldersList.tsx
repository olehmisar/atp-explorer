import { TokenHolder } from '@/types/atp';
import { formatTokenAmount, truncateAddress } from '@/lib/utils';

interface TokenHoldersListProps {
  holders: TokenHolder[];
}

export default function TokenHoldersList({ holders }: TokenHoldersListProps) {
  // Sort holders by balance (descending)
  const sortedHolders = [...holders].sort((a, b) => {
    try {
      return BigInt(b.balance) > BigInt(a.balance) ? 1 : -1;
    } catch {
      return 0;
    }
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Top Token Holders
      </h2>
      {sortedHolders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No token holders found
        </p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedHolders.slice(0, 20).map((holder, index) => (
            <div
              key={holder.address}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {index + 1}
                </div>
                <div>
                  <a
                    href={`https://etherscan.io/address/${holder.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {truncateAddress(holder.address)}
                  </a>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatTokenAmount(holder.balance)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  AZTEC
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
