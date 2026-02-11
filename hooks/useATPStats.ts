import { ATPExplorerData } from "@/types/atp";
import { useQuery } from "@tanstack/react-query";

const CACHE_KEY = "atp-stats-cache";
const ONE_HOUR_MS = 60 * 60 * 1000;

// Build/deploy identifier - invalidates cache when app is redeployed
const DATA_VERSION = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

async function fetchATPStats(): Promise<ATPExplorerData> {
  const localforage =
    typeof window !== "undefined"
      ? (await import("localforage")).default
      : null;

  if (localforage) {
    try {
      const raw = await localforage.getItem<{
        data: ATPExplorerData;
        timestamp: number;
        version: string;
      }>(CACHE_KEY);
      if (raw) {
        const { data, timestamp, version } = raw;
        if (version === DATA_VERSION && Date.now() - timestamp < ONE_HOUR_MS) {
          return data;
        }
      }
    } catch {
      // ignore, fetch below
    }
  }

  const response = await fetch("/api/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  const data = await response.json();

  if (localforage) {
    const payload = {
      data,
      timestamp: Date.now(),
      version: DATA_VERSION,
    };
    try {
      await localforage.setItem(CACHE_KEY, payload);
    } catch {
      // QuotaExceededError or other - clear old cache and retry once
      try {
        await localforage.removeItem(CACHE_KEY);
        await localforage.setItem(CACHE_KEY, payload);
      } catch {
        // Still failed - skip caching, data is still returned
      }
    }
  }
  return data;
}

export function useATPStats() {
  return useQuery({
    queryKey: ["atp-stats"],
    queryFn: fetchATPStats,
    staleTime: ONE_HOUR_MS,
    gcTime: ONE_HOUR_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
}
