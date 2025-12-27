/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param retries - Number of retry attempts (default: 3)
 * @param baseDelayMs - Base delay in milliseconds for exponential backoff (default: 1000)
 * @returns Promise that resolves with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelayMs: number = 1000,
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === retries - 1;

      // Log the error
      console.error(
        `Error on attempt ${attempt + 1}/${retries}:`,
        error instanceof Error ? error.message : error,
      );

      if (isLastAttempt) {
        console.error("All retry attempts failed");
        throw error;
      }

      // Exponential backoff: wait baseDelayMs * 2^attempt
      const waitTime = baseDelayMs * Math.pow(2, attempt);
      console.warn(
        `Retrying after ${waitTime}ms (attempt ${attempt + 1}/${retries})...`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error("Failed after all retries");
}
