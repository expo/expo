export type AppStartupTimes = {
    /**
     * Time from when the user taps the app to the moment the app starts executing the main code.
     * It includes loading native dynamic libraries, executing C++ static constructors
     * and Objective-C `+load` methods defined in classes or categories.
     *
     * @platform iOS
     */
    loadTime?: number;
    /**
     * Full time from process start until the root view of the React Native instance is created,
     * recorded when the app is launched fresh by the user.
     */
    coldLaunchTime?: number;
    /**
     * Launch time recorded when the process was already running in the background
     * before the user launches the app.
     */
    warmLaunchTime?: number;
    /**
     * Duration to evaluate the JavaScript bundle by the runtime.
     */
    bundleLoadTime?: number;
    /**
     * Time until the first React render occurs.
     */
    timeToFirstRender?: number;
    /**
     * Time until the app is interactive (after first render).
     */
    timeToInteractive?: number;
};
export type MemoryUsageSnapshot = {
    /**
     * Memory in bytes allocated by the app, including both the physical memory and additional memory that the app might be using,
     * such as memory that has been paged out (swapped) to disk or memory that is shared with other processes.
     *
     * @platform iOS
     */
    allocated?: number;
    /**
     * Physical memory in bytes pages currently in use (resident size).
     */
    physical: number;
    /**
     * The amount of available memory in bytes that app can still allocate.
     */
    available: number;
    /**
     * The amount of memory in bytes currently used by the Java heap.
     *
     * @platform android
     */
    javaHeap?: number;
};
export type FrameRateMetrics = {
    /**
     * Total amount of frames rendered.
     */
    renderedFrames: number;
    /**
     * Expected amount of frames rendered if everything renders without any delay.
     */
    expectedFrames: number;
    /**
     * Number of frames which were skipped because the main thread was busy with some work.
     */
    droppedFrames: number;
    /**
     * Total amount of frozen frames. Frozen frame is frame that takes at least 700ms to render.
     * It is a term from [Android development](https://developer.android.com/topic/performance/vitals/frozen).
     */
    frozenFrames: number;
    /**
     * Total amount of slow frames. Slow frame is frame that takes at least 17ms to render.
     * It is a term from [Android development](https://developer.android.com/topic/performance/vitals/render).
     */
    slowFrames: number;
    /**
     * Total amount of freeze durations, in seconds. Freeze is an amount of time every frame rendering was delayed by in comparison with the ideal performant frame.
     * For example if expected frame duration was 16ms, but in reality we've rendered this frame in 320ms, we have a freeze with 304ms duration.
     */
    freezeTime: number;
    /**
     * Total duration of the screen session, in seconds. It is counted by summing up all rendered frames duration.
     */
    sessionDuration: number;
};
export interface Metric {
    timestamp: string;
    category: string;
    name: string;
    value: number;
    sessionId: string;
    routeName?: string;
    params?: Record<string, unknown>;
}
export type MetricAttributes = {
    /**
     * Name of the route associated with the metric. Some metrics populate this
     * with a sensible default when omitted — for example, the TTI metric falls
     * back to the initial route name detected from the router.
     */
    routeName?: string;
    /**
     * Custom parameters to attach to the metric.
     */
    params?: Record<string, unknown>;
};
/**
 * Severity of a log event, ordered from least to most severe:
 *
 * - `"trace"` — Fine-grained tracing, typically only useful while reproducing
 *   a specific issue.
 * - `"debug"` — Diagnostic detail useful during development; usually filtered
 *   out in production.
 * - `"info"` — Routine, expected events that record normal app behavior.
 * - `"warn"` — Unexpected but recoverable conditions worth investigating.
 * - `"error"` — An operation failed; the app continues running but is in a
 *   degraded state.
 * - `"fatal"` — A severe failure, often immediately followed by app termination.
 */
export type LogSeverity = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
/**
 * Value types accepted in a log event's `attributes` map. Strings, numbers,
 * and booleans are stored as typed primitives; arrays and nested maps preserve
 * their structure. Other JS values (functions, `Date`, `undefined`, etc.) are
 * not supported and may be dropped by downstream consumers.
 */
export type LogAttributeValue = string | number | boolean | LogAttributeValue[] | {
    [key: string]: LogAttributeValue;
};
/**
 * A single log event collected during a session.
 */
export type LogRecord = {
    /**
     * ISO 8601 timestamp of when the record was created.
     */
    timestamp: string;
    /**
     * Event name.
     */
    name: string;
    /**
     * Optional free-form message describing the event.
     */
    body?: string | null;
    /**
     * Custom attributes attached to the event. Each entry is preserved with its
     * original value type — see `LogAttributeValue` for the supported shapes.
     */
    attributes?: Record<string, LogAttributeValue> | null;
    /**
     * Severity of the event.
     */
    severity: LogSeverity;
};
/**
 * Optional configuration accepted by `logEvent`. The event name is passed as
 * the first positional argument since it's required and the only field most
 * callers set.
 */
export type LogEventOptions = {
    /**
     * Optional free-form message describing the event.
     */
    body?: string | null;
    /**
     * Custom attributes attached to the event. Each entry is preserved with its
     * original value type — see `LogAttributeValue` for the supported shapes.
     */
    attributes?: Record<string, LogAttributeValue> | null;
    /**
     * Severity of the event.
     *
     * @default "info"
     */
    severity?: LogSeverity | null;
};
export type SessionType = 'main' | 'foreground' | 'screen' | 'custom' | 'unknown';
export type CrashKind = 'badAccess' | 'fatalError' | 'divideByZero' | 'forceUnwrapNil' | 'arrayOutOfBounds' | 'objcException' | 'stackOverflow';
type SessionBase = {
    id: string;
    startDate: string;
    endDate?: string | null;
    metrics: Metric[];
    logs: LogRecord[];
};
export type MainSession = SessionBase & {
    type: 'main';
    crashReport?: CrashReport | null;
};
export type GenericSession = SessionBase & {
    type: Exclude<SessionType, 'main'>;
};
export type Session = MainSession | GenericSession;
export type CallStackFrame = {
    binaryName?: string | null;
    binaryUUID?: string | null;
    address?: number | null;
    offsetIntoBinaryTextSegment?: number | null;
    sampleCount?: number | null;
    subFrames?: CallStackFrame[] | null;
    /**
     * Resolved symbol from on-device `dladdr` symbolication. Swift and Itanium-ABI C++
     * names are demangled; Objective-C selectors and plain C symbols are returned as-is.
     * `null` when the binary is not loaded in this process or `dladdr` could not resolve it.
     *
     * @platform ios
     */
    symbol?: string | null;
};
export type CallStack = {
    threadAttributed?: boolean | null;
    callStackRootFrames?: CallStackFrame[] | null;
};
export type CallStackTree = {
    callStacks?: CallStack[] | null;
};
export type CrashReport = {
    exceptionType?: number | null;
    exceptionCode?: number | null;
    signal?: number | null;
    terminationReason?: string | null;
    virtualMemoryRegionInfo?: string | null;
    exceptionReason?: {
        composedMessage: string;
        formatString: string;
        arguments: string[];
        exceptionType: string;
        className: string;
        exceptionName: string;
    } | null;
    callStackTree?: CallStackTree | null;
    timestampBegin: string;
    timestampEnd: string;
    ingestedAt: string;
};
export interface ExpoAppMetricsModuleType {
    markFirstRender(): void;
    markInteractive(attributes?: MetricAttributes): void;
    /**
     * Records a log event against the current main session. The event is
     * persisted locally and dispatched on the next `dispatchEvents()` flush as an
     * OpenTelemetry log record sent to the `/v1/logs` endpoint.
     *
     * Severity defaults to `"info"` when not provided.
     *
     * @param name Event name. Maps to the OpenTelemetry `event.name` attribute.
     * @param options Optional body, attributes, and severity overrides.
     */
    logEvent(name: string, options?: LogEventOptions): void;
    getStoredEntries(): Promise<Metric[]>;
    clearStoredEntries(): Promise<void>;
    /**
     * Returns all sessions across the current and historical entries,
     * ordered with the current launch first.
     *
     * @private This API is unstable and may change without notice.
     * @platform ios
     */
    getAllSessions(): Promise<Session[]>;
    /**
     * Simulates a crash report, attributing it to the current main session.
     * Intended for development and debugging only.
     *
     * @private This API is unstable and may change without notice.
     * @platform ios
     */
    simulateCrashReport(): void;
    /**
     * Intentionally crashes the app to produce a real MetricKit diagnostic.
     * Intended for development and debugging only.
     *
     * @private This API is unstable and may change without notice.
     * @platform ios
     */
    triggerCrash(kind: CrashKind): void;
    /**
     * @private This API is unstable and may change without notice.
     * @platform android
     */
    addCustomMetricToSession(metric: Metric): Promise<void>;
    /**
     * Returns the current main session, including its metrics. Resolves to
     * `null` if the session row hasn't been persisted yet.
     *
     * @private This API is unstable and may change without notice.
     * @platform android
     */
    getMainSession(): Promise<MainSession | null>;
}
export {};
//# sourceMappingURL=types.d.ts.map