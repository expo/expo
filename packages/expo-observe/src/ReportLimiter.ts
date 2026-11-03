const REPORT_WINDOW_MS = 15 * 60_000;
const MAX_DISTINCT_MESSAGES_PER_WINDOW = 20;

/**
 * Limits how often messages are reported. Each distinct message is reported at most once in a
 * 15-minute window, and at most 20 distinct messages are reported in a window. The window lets a
 * message be reported again later, and the cap bounds the reports when messages embed varying
 * values.
 */
export class ReportLimiter {
  // Maps each message reported in the current window to the time it was reported. A `Map` keeps
  // insertion order, so the oldest report is always first. The time comes from the monotonic
  // `performance.now()`, so a change to the device clock cannot stop expiry.
  private readonly reported = new Map<string, number>();

  /**
   * Returns whether `message` can be reported now. A `true` result counts as a report.
   */
  shouldReport(message: string): boolean {
    const now = performance.now();
    for (const [reportedMessage, reportedAt] of this.reported) {
      if (now - reportedAt < REPORT_WINDOW_MS) {
        break;
      }
      this.reported.delete(reportedMessage);
    }
    if (this.reported.has(message) || this.reported.size >= MAX_DISTINCT_MESSAGES_PER_WINDOW) {
      return false;
    }
    this.reported.set(message, now);
    return true;
  }
}
