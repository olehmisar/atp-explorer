"use client";

import { useATPStats } from "@/hooks/useATPStats";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { formatTokenAmount } from "@/lib/utils";
import { ATPData } from "@/types/atp";

export default function SearchResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchAddress = (params.address as string)?.toLowerCase() || "";

  const {
    data,
    isLoading: loading,
    error,
  } = useATPStats();

  const atps = data?.atps ?? [];

  // Find matching ATPs
  const searchResults = useMemo(() => {
    if (!searchAddress || !atps.length) return [];

    const normalizedSearch = searchAddress.toLowerCase();

    // First, check if it's an exact ATP address match
    const exactATP = atps.find(
      (atp) => atp.address.toLowerCase() === normalizedSearch
    );

    if (exactATP) {
      return [exactATP];
    }

    // Then, check for beneficiary matches
    const beneficiaryMatches = atps.filter(
      (atp) => atp.beneficiary.toLowerCase() === normalizedSearch
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Searching...
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
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Redirecting...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No results
  if (searchResults.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              No Results Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No ATPs found for address:
            </p>
            <p className="font-mono text-sm text-gray-500 dark:text-gray-500 mb-6">
              {searchAddress}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try searching by ATP address or beneficiary address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Multiple results - show them
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Search Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Found {searchResults.length} ATP{searchResults.length !== 1 ? "s" : ""} for beneficiary:
          </p>
          <p className="font-mono text-sm text-gray-500 dark:text-gray-500 mb-6">
            {searchAddress}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ATP Address
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Allocation
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((atp) => (
                  <tr
                    key={atp.address}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/atp/${atp.address}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm"
                      >
                        {atp.address}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                      {atp.type}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          atp.isRevoked
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            : atp.isRevokable
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        }`}
                      >
                        {atp.isRevoked
                          ? "Revoked"
                          : atp.isRevokable
                            ? "Revokable"
                            : "Non-Revokable"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
                      {formatTokenAmount(atp.allocation)} AZTEC
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 text-right">
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

