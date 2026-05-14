import type { SharedObject } from 'expo';

import type { CrashReport, LogRecord, Metric, SessionType } from './types';

/**
 * A session is a time frame during the app's lifetime that tracks metrics and
 * log events. Returned as a shared object so metric and log history is fetched
 * lazily on demand instead of being shipped eagerly on every read.
 *
 * @private This API is unstable and may change without notice.
 */
export declare class Session extends SharedObject {
  readonly id: string;
  readonly type: SessionType;
  readonly startDate: string;
  readonly endDate: string | null;

  getMetrics(): Promise<Metric[]>;
  getLogs(): Promise<LogRecord[]>;
  addMetric(metric: Metric): Promise<void>;
  /**
   * Returns the crash report associated with this session, or `null` if the
   * app didn't crash during it. Only the main session ever surfaces a report;
   * every other session type returns `null`. Android always returns `null`
   * until native crash reporting lands there.
   */
  getCrashReport(): Promise<CrashReport | null>;
}
