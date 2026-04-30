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
export type SessionType = 'main' | 'foreground' | 'screen' | 'custom' | 'unknown';
export type CrashKind = 'badAccess' | 'fatalError' | 'divideByZero' | 'forceUnwrapNil' | 'arrayOutOfBounds' | 'objcException' | 'stackOverflow';
type SessionBase = {
    id: string;
    startDate: string;
    endDate?: string | null;
    metrics: Metric[];
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
     * Starts a new app metrics session. Returns the session ID.
     *
     * @platform android
     */
    startSession(): string;
    /**
     * Stops the app metrics session with the given session ID.
     *
     * @platform android
     */
    stopSession(sessionId: string): void;
    /**
     * @platform android
     */
    addCustomMetricToSession(sessionId: string, metric: {
        category: string;
        name: string;
        value: number;
        routeName?: string;
        params?: Record<string, unknown>;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=types.d.ts.map