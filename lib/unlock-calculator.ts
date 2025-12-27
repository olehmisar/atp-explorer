import { Lock } from "@/types/atp";

export interface UnlockPoint {
  timestamp: number; // Timestamp in milliseconds
  unlocked: string; // Amount unlocked at this timestamp
  cumulative: string; // Cumulative amount unlocked across all ATPs
}

export interface UnlockSchedule {
  cliffEnd: number; // Timestamp when cliff ends (in milliseconds)
  fullUnlock: number; // Timestamp when fully unlocked (in milliseconds)
  currentUnlocked: string; // Amount currently unlocked
  fullyUnlocked: boolean; // Whether the lock has fully unlocked
}

/**
 * Calculate unlock schedule for a single lock
 *
 * This matches the logic from LockLib.unlockedAt() in the contract:
 * - Before cliffEnd: 0 unlocked
 * - After fullUnlock: amount unlocked (fully unlocked)
 * - Between cliffEnd and fullUnlock: linear unlock
 *   Formula: (elapsed / lockDuration) * amount
 *
 * Note: The lock.amount should equal the allocation for LATP contracts
 * as getGlobalLock() uses LockLib.createLock(globalLockParams, allocation)
 */
export function calculateUnlockSchedule(
  lock: Lock,
  currentTime: number = Date.now(),
): UnlockSchedule {
  // All timestamps are now in milliseconds (converted from seconds in atp-detector.ts)
  const startTime = Number(lock.startTime); // Unix timestamp in milliseconds
  const cliffDuration = Number(lock.cliffDuration); // Duration in milliseconds (cliff - startTime)
  const lockDuration = Number(lock.lockDuration); // Duration in milliseconds (endTime - startTime)

  // Calculate timestamps
  const cliffEnd = startTime + cliffDuration; // Cliff timestamp in milliseconds
  const fullUnlock = startTime + lockDuration; // End timestamp in milliseconds (not startTime + cliffDuration + lockDuration!)
  const amount = BigInt(lock.amount);

  let currentUnlocked: bigint;
  let fullyUnlocked: boolean;

  if (currentTime < cliffEnd) {
    // Before cliff ends, nothing is unlocked (matches contract: unlockedAt returns 0)
    currentUnlocked = BigInt(0);
    fullyUnlocked = false;
  } else if (currentTime >= fullUnlock) {
    // After full unlock, everything is unlocked (matches contract: hasEnded returns true)
    currentUnlocked = amount;
    fullyUnlocked = true;
  } else {
    // Linear unlock between cliff end and full unlock
    // Matches LockLib.unlockedAt() calculation exactly:
    // unlockedAt = (allocation * (timestamp - startTime)) / (endTime - startTime)
    // Note: The formula uses (timestamp - startTime), NOT (timestamp - cliff)!
    const elapsedFromStart = currentTime - startTime; // milliseconds since startTime
    const totalLockDuration = lockDuration; // milliseconds (endTime - startTime)

    // Use BigInt for precision to match Solidity arithmetic
    // Convert milliseconds to seconds for calculation (to match contract which uses seconds)
    const elapsedFromStartSeconds = Math.floor(elapsedFromStart / 1000);
    const totalLockDurationSeconds = Math.floor(totalLockDuration / 1000);

    const elapsedBigInt = BigInt(elapsedFromStartSeconds);
    const durationBigInt = BigInt(totalLockDurationSeconds);

    // Calculate: (amount * (timestamp - startTime)) / (endTime - startTime)
    // This matches the contract's unlockedAt calculation exactly
    if (durationBigInt === BigInt(0)) {
      currentUnlocked = BigInt(0);
    } else {
      currentUnlocked = (amount * elapsedBigInt) / durationBigInt;
    }

    // Cap at amount (safety check, should not be needed)
    if (currentUnlocked > amount) {
      currentUnlocked = amount;
    }
    fullyUnlocked = false;
  }

  return {
    cliffEnd,
    fullUnlock,
    currentUnlocked: currentUnlocked.toString(),
    fullyUnlocked,
  };
}

/**
 * Generate unlock points for a chart (time series data)
 */
export function generateUnlockPoints(
  locks: Lock[],
  startTime: number, // in milliseconds
  endTime: number, // in milliseconds
  points: number = 100,
): UnlockPoint[] {
  const timeStep = (endTime - startTime) / points;
  const pointsData: UnlockPoint[] = [];
  let cumulativeUnlocked = BigInt(0);

  for (let i = 0; i <= points; i++) {
    const timestamp = startTime + i * timeStep; // in milliseconds
    let totalUnlockedAtTime = BigInt(0);

    locks.forEach((lock) => {
      const schedule = calculateUnlockSchedule(lock, timestamp);
      totalUnlockedAtTime += BigInt(schedule.currentUnlocked);
    });

    cumulativeUnlocked = totalUnlockedAtTime;

    pointsData.push({
      timestamp, // Keep in milliseconds
      unlocked: totalUnlockedAtTime.toString(),
      cumulative: cumulativeUnlocked.toString(),
    });
  }

  return pointsData;
}

/**
 * Calculate aggregate unlock statistics
 */
export function calculateUnlockStats(
  locks: Lock[],
  currentTime: number = Date.now(), // in milliseconds
) {
  let totalLocked = BigInt(0);
  let totalUnlocked = BigInt(0);
  let totalFullyUnlocked = 0;
  let totalInCliff = 0;
  let totalUnlocking = 0;

  locks.forEach((lock) => {
    const amount = BigInt(lock.amount);
    totalLocked += amount;

    const schedule = calculateUnlockSchedule(lock, currentTime);
    totalUnlocked += BigInt(schedule.currentUnlocked);

    if (schedule.fullyUnlocked) {
      totalFullyUnlocked++;
    } else if (currentTime < schedule.cliffEnd) {
      totalInCliff++;
    } else {
      totalUnlocking++;
    }
  });

  return {
    totalLocked: totalLocked.toString(),
    totalUnlocked: totalUnlocked.toString(),
    totalFullyUnlocked,
    totalInCliff,
    totalUnlocking,
    unlockPercentage:
      totalLocked > 0
        ? (Number((totalUnlocked * BigInt(10000)) / totalLocked) / 100).toFixed(
            2,
          )
        : "0.00",
  };
}
