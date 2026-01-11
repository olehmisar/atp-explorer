"use client";

import { useATPStats } from "@/hooks/useATPStats";
import { formatTokenAmount } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function SearchResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchAddress = (params.address as string)?.toLowerCase() || "";

  const { data, isLoading: loading, error } = useATPStats();

  const atps = data?.atps ?? [];

  // Find matching ATPs
  const searchResults = useMemo(() => {
    if (!searchAddress || !atps.length) return [];

    const normalizedSearch = searchAddress.toLowerCase();

    // First, check if it's an exact ATP address match
    const exactATP = atps.find(
      (atp) => atp.address.toLowerCase() === normalizedSearch,
    );

    if (exactATP) {
      return [exactATP];
    }

    // Then, check for beneficiary matches
    const beneficiaryMatches = atps.filter(
      (atp) => atp.beneficiary.toLowerCase() === normalizedSearch,
    );

    return beneficiaryMatches;
  }, [searchAddress, atps]);

  // Redirect to ATP page if only 1 result
  useEffect(() => {
    if (!loading && searchResults.length === 1) {
      router.replace(`/atp/${searchResults[0].address}`);
    }
  }, [searchResults, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lapis to-[#001A3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-2 border-aqua border-t-transparent mx-auto"></div>
              <p className="mt-4 text-[#B4B0A0]">Searching...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lapis to-[#001A3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#3A1A1A]">
            <h2 className="text-[#FF6B6B]">Error</h2>
            <p className="text-[#FF8A8A]">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-vermillion text-lapis rounded hover:bg-red-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If redirecting (only 1 result), show loading state
  if (searchResults.length === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lapis to-[#001A3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin h-12 w-12 border-2 border-aqua border-t-transparent mx-auto"></div>
              <p className="mt-4 text-[#B4B0A0]">Redirecting...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No results
  if (searchResults.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lapis to-[#001A3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/" className="text-chartreuse hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
          <div className="bg-[#2A2410] shadow-md p-8 text-center border border-[#3A3420]">
            <h1 className="text-2xl font-light text-chartreuse mb-4">
              No Results Found
            </h1>
            <p className="text-[#B4B0A0] mb-2">No ATPs found for address:</p>
            <p className="font-mono text-sm text-[#948F80] mb-6">
              {searchAddress}
            </p>
            <p className="text-sm text-[#948F80]">
              Try searching by ATP address or beneficiary address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Multiple results - show them
  return (
    <div className="min-h-screen bg-gradient-to-br from-lapis to-[#001A3A]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-chartreuse hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-[#2A2410]">
          <h1 className="text-2xl font-light text-chartreuse">
            Search Results
          </h1>
          <p className="text-[#B4B0A0]">
            Found {searchResults.length} ATP
            {searchResults.length !== 1 ? "s" : ""} for beneficiary:
          </p>
          <p className="font-mono text-sm text-[#948F80]">{searchAddress}</p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#3A3420]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#B4B0A0]">
                    ATP Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#B4B0A0]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#B4B0A0]">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#B4B0A0]">
                    Allocation
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#B4B0A0]">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((atp) => (
                  <tr key={atp.address} className="border-b border-[#E4DCC8]">
                    <td className="py-3 px-4">
                      <Link
                        href={`/atp/${atp.address}`}
                        className="text-chartreuse hover:underline"
                      >
                        {atp.address}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-aqua">{atp.type}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1  text-xs font-medium ${
                          atp.isRevoked
                            ? "bg-[#FFE6E6] text-vermillion"
                            : atp.isRevokable
                            ? "bg-aqua/30 text-aqua"
                            : "bg-malachite/30 text-aqua"
                        }`}
                      >
                        {atp.isRevoked
                          ? "Revoked"
                          : atp.isRevokable
                          ? "Revokable"
                          : "Non-Revokable"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-aqua">
                      {formatTokenAmount(atp.allocation)} AZTEC
                    </td>
                    <td className="py-3 px-4 text-sm text-aqua">
                      {formatTokenAmount(atp.balance)} AZTEC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
