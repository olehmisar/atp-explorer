"use client";

import ATPTable from "@/components/ATPTable";
import StatsCards from "@/components/StatsCards";
import TokenHoldersList from "@/components/TokenHoldersList";
import TypeDistribution from "@/components/TypeDistribution";
import UnlockChart from "@/components/UnlockChart";
import UnlockStats from "@/components/UnlockStats";
import { AZTEC_TOKEN_ADDRESS } from "@/lib/constants";
import { format } from "date-fns";
import { useState } from "react";
import Link from "next/link";
import { useATPStats } from "@/hooks/useATPStats";

export default function Home() {
  const [searchAddress, setSearchAddress] = useState("");
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useATPStats();

  const stats = data?.stats ?? null;
  const atps = data?.atps ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading ATP statistics...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h2 className="text-red-800 dark:text-red-200 font-semibold mb-2">
              Error
            </h2>
            <p className="text-red-600 dark:text-red-300">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            ATP Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aztec Token Position Statistics
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Token Address:{" "}
            <span className="font-mono">{AZTEC_TOKEN_ADDRESS}</span>
          </p>
          {data?.lastUpdated && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Last updated: {format(new Date(data.lastUpdated), "PPpp")}
            </p>
          )}
          {/* Search Bar */}
          <div className="mt-4">
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchAddress.trim()) {
                    e.preventDefault();
                    window.location.href = `/search/${searchAddress.trim()}`;
                  }
                }}
                placeholder="Search by ATP address or beneficiary address..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Link
                href={searchAddress.trim() ? `/search/${searchAddress.trim()}` : "#"}
                className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                  !searchAddress.trim() ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                }`}
              >
                Search
              </Link>
            </div>
          </div>
        </header>

        {stats && (
          <>
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <TypeDistribution stats={stats} />
              <TokenHoldersList holders={stats.tokenHolders.holders} />
            </div>
          </>
        )}

        <div className="mt-8">
          <UnlockStats atps={atps} />
        </div>

        <div className="mt-8">
          <UnlockChart atps={atps} />
        </div>

        <div className="mt-8">
          <ATPTable atps={atps} />
        </div>
      </div>
    </div>
  );
}
