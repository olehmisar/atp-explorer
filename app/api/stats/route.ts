import { getCachedStats } from "@/lib/redis";
import { ATPExplorerData } from "@/types/atp";
import { NextResponse } from "next/server";

/**
 * GET endpoint - returns cached data only
 * Cache is refreshed by cron job at /api/refresh
 */
export async function GET() {
  try {
    const cached = await getCachedStats();
    if (!cached) {
      return NextResponse.json(
        {
          error: "No cached data available",
          message:
            "Cache is being refreshed. Please try again in a few minutes.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(cached as ATPExplorerData);
  } catch (error) {
    console.error("Error in stats API:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
