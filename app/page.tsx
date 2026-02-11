"use client";

import ATPDistributionChart from "@/components/ATPDistributionChart";
import ATPTable from "@/components/ATPTable";
import StatsCards from "@/components/StatsCards";
import TokenHoldersList from "@/components/TokenHoldersList";
import TypeDistribution from "@/components/TypeDistribution";
import UnlockChart from "@/components/UnlockChart";
import UnlockStats from "@/components/UnlockStats";
import { useATPStats } from "@/hooks/useATPStats";
import { AZTEC_TOKEN_ADDRESS } from "@/lib/constants";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [searchAddress, setSearchAddress] = useState("");
  const { data, isLoading: loading, error, refetch } = useATPStats();

  const stats = data?.stats ?? null;
  const atps = data?.atps ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-lapis">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-2 border-aqua border-t-transparent mx-auto"></div>
              <p className="mt-4 text-aqua">Loading ATP statistics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lapis">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#3A1A1A] border border-vermillion/50 p-4">
            <h2 className="text-[#FF6B6B] font-semibold mb-2">Error</h2>
            <p className="text-[#FF8A8A]">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-vermillion text-lapis hover:bg-[#E61A1A] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lapis">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-light text-chartreuse mb-2">
            ATP Explorer
          </h1>
          <p className="text-[#D4D0C0] font-body">
            Aztec Token Position Statistics
          </p>
          <p className="text-sm text-[#B4B0A0] mt-1">
            This website is community owned and is not affiliated with Aztec
            Foundation or Aztec Labs in any form.
          </p>
          <p className="text-sm text-[#B4B0A0] mt-2">
            Token Address:{" "}
            <span className="font-mono">{AZTEC_TOKEN_ADDRESS}</span>
          </p>
          {data?.lastUpdated && (
            <p className="text-xs text-[#948F80] mt-1">
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
                className="flex-1 px-4 py-2 border border-[#3A3420] bg-[#2A2410] text-chartreuse placeholder-[#6A6450] focus:outline-none focus:ring-2 focus:ring-chartreuse focus:border-chartreuse"
              />
              <Link
                href={
                  searchAddress.trim() ? `/search/${searchAddress.trim()}` : "#"
                }
                className={`px-6 py-2 bg-chartreuse text-lapis hover:bg-[#C4EF18] focus:outline-none focus:ring-2 focus:ring-chartreuse text-center font-medium transition-colors ${
                  !searchAddress.trim()
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : ""
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
          <ATPDistributionChart
            atps={atps}
            tokenHolders={stats?.tokenHolders?.holders ?? []}
          />
        </div>

        <div className="mt-8">
          <ATPTable atps={atps} />
        </div>
      </div>
    </div>
  );
}
