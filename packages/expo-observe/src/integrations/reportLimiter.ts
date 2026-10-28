// A log message can repeat many times, so each distinct message is reported at most once per
// window. The cap bounds the reports in a window when messages embed varying values, and the
// window lets new messages be reported again after a surge.
const REPORT_WINDOW_MS = 15 * 60_000;
const MAX_DISTINCT_MESSAGES_PER_WINDOW = 20;
// Attribute values are sent on every dispatch, so a copied message is capped. Messages are also
// deduplicated by this capped text, so two messages that differ only after the cap do not send
// the same attribute twice.
const MAX_MESSAGE_LENGTH = 500;

/**
 * Limits how often an integration reports log messages. An integration creates one limiter for
 * each level it reports, so many distinct warnings cannot stop errors from being reported.
 */
export interface ReportLimiter {
  /**
   * Returns the message capped to the length that reports use, or `null` when the message was
   * already reported in the current window or the window is full.
   */
  allow(message: string): string | null;
}

export function createReportLimiter(): ReportLimiter {
  // Maps the capped text of each message reported in the current window to the time it was
  // reported. A `Map` keeps insertion order, so the oldest report is always first. The time comes
  // from the monotonic `performance.now()`, so a change to the device clock cannot stop expiry.
  const reported = new Map<string, number>();

  function removeExpiredReports(now: number): void {
    for (const [message, reportedAt] of reported) {
      if (now - reportedAt < REPORT_WINDOW_MS) {
        return;
      }
      reported.delete(message);
    }
  }

  return {
    allow(message) {
      const cappedMessage = message.slice(0, MAX_MESSAGE_LENGTH);
      const now = performance.now();
      removeExpiredReports(now);
      if (reported.has(cappedMessage) || reported.size >= MAX_DISTINCT_MESSAGES_PER_WINDOW) {
        return null;
      }
      reported.set(cappedMessage, now);
      return cappedMessage;
    },
  };
}
