import { ATPExplorerData } from "@/types/atp";
import { useQuery } from "@tanstack/react-query";

async function fetchATPStats(): Promise<ATPExplorerData> {
  const response = await fetch("/api/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
}

export function useATPStats() {
  return useQuery({
    queryKey: ["atp-stats"],
    queryFn: fetchATPStats,
  });
}
