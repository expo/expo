import type { SharedObject } from 'expo';
import type { CrashReport, LogRecord, Metric, MetricInput, SessionType } from './types';
/**
 * A session recorded by App Metrics, backed by a native shared object.
 *
 * The scalar properties (`id`, `type`, `startDate`, `hasCrashReport`) are
 * snapshots taken when the object is created — they do not update as the
 * session evolves. Properties that can change over the session's lifetime
 * (`isActive`, `getEndDate`) and the heavier collections (`getMetrics`,
 * `getLogs`, `getCrashReport`) are fetched lazily from the on-device store
 * so they reflect live state on each call.
 *
 * Instances are created natively and returned from `getAllSessions()` and
 * `getMainSession()`; each call returns fresh objects, so identity (`===`)
 * is not stable across calls.
 *
 * @private This API is unstable and may change without notice.
 */
export declare class Session extends SharedObject {
    /**
     * Unique identifier (UUID) of the session.
     */
    readonly id: string;
    /**
     * Kind of session. The per-launch session is `'main'`.
     */
    readonly type: SessionType;
    /**
     * ISO 8601 timestamp of when the session started.
     */
    readonly startDate: string;
    /**
     * Whether a crash report is attached to the session. This is a cheap
     * snapshot intended for list UIs — use `getCrashReport()` to fetch the
     * full payload.
     *
     * Always `false` on Android, where crash reports (a MetricKit feature)
     * are not collected.
     */
    readonly hasCrashReport: boolean;
    /**
     * Fetches whether the session is still active. Read lazily so it reflects
     * the session's live state rather than a snapshot from when the object was
     * created.
     */
    isActive(): Promise<boolean>;
    /**
     * Fetches the ISO 8601 timestamp of when the session ended, or `null` while
     * it is still active. Read lazily so it reflects live state.
     */
    getEndDate(): Promise<string | null>;
    /**
     * Fetches the metrics recorded during this session from the on-device
     * store.
     */
    getMetrics(): Promise<Metric[]>;
    /**
     * Fetches the log events recorded during this session from the on-device
     * store.
     */
    getLogs(): Promise<LogRecord[]>;
    /**
     * Fetches the crash report attached to this session, or `null` when there
     * is none. Always resolves to `null` on Android.
     */
    getCrashReport(): Promise<CrashReport | null>;
    /**
     * Records a custom metric against this session. The session id is implied
     * by the receiver, so the metric input carries no `sessionId`.
     */
    addMetric(metric: MetricInput): Promise<void>;
}
//# sourceMappingURL=Session.d.ts.map