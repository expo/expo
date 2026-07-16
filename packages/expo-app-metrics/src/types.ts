import type { SharedObject } from 'expo';

import type { Session } from './Session';

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
  routeName?: string | null;
  params?: Record<string, unknown>;
}

export type MetricAttributes = {
  /**
   * Name of the route associated with the metric. Some metrics populate this
   * with a sensible default when omitted — for example, the TTI metric falls
   * back to the initial route name detected from the router.
   */
  routeName?: string | null;
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
export type LogAttributeValue =
  | string
  | number
  | boolean
  | LogAttributeValue[]
  | { [key: string]: LogAttributeValue };

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
   * Optional human-friendly label for the event. Unlike `name` (a stable machine
   * identifier), this is meant for display in dashboards and is not constrained
   * to a naming scheme.
   */
  displayName?: string | null;
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

/**
 * Payload accepted by `Session.addMetric`. The owning session is implied by the
 * receiver, so the input carries every `Metric` field except `sessionId`.
 */
export type MetricInput = Omit<Metric, 'sessionId'>;

export type CallStackFrame = {
  /** @platform ios */
  binaryName?: string | null;
  /** @platform ios */
  binaryUUID?: string | null;
  /** @platform ios */
  address?: number | null;
  /** @platform ios */
  offsetIntoBinaryTextSegment?: number | null;
  /** @platform ios */
  sampleCount?: number | null;
  subFrames?: CallStackFrame[] | null;
  /**
   * Human-readable symbol for the frame.
   *
   * On iOS, resolved by on-device `dladdr` symbolication: Swift and Itanium-ABI C++
   * names are demangled; Objective-C selectors and plain C symbols are returned as-is.
   * `null` when the binary is not loaded in this process or `dladdr` could not resolve it.
   *
   * On Android, the frame string of the JVM stack trace
   * (for example `com.example.MainActivity.onCreate(MainActivity.kt:42)`) —
   * always present since JVM stacks are symbolic by construction.
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

/**
 * A crash attributed to a session. The populated fields depend on the platform
 * and crash type:
 *
 * - iOS (MetricKit): the numeric `exceptionType`/`exceptionCode`/`signal`
 *   fields, plus `exceptionReason` for unhandled Objective-C exceptions.
 * - Android JVM crashes: `exceptionReason` is the throwable's composed message
 *   string (numeric fields stay `null` — they're Mach/Unix codes that don't
 *   exist for JVM exceptions).
 * - Android native crashes: `signal` and `terminationReason` from the OS exit
 *   record; no call stack.
 */
export type CrashReport = {
  /**
   * Mach exception type (e.g. `EXC_BAD_ACCESS`).
   * @platform ios
   */
  exceptionType?: number | null;
  /**
   * Processor-specific exception code.
   * @platform ios
   */
  exceptionCode?: number | null;
  /** Unix signal number (e.g. SIGSEGV = 11). */
  signal?: number | null;
  /** Human-readable description of the termination reason. */
  terminationReason?: string | null;
  /**
   * Memory region info for bad-access crashes.
   * @platform ios
   */
  virtualMemoryRegionInfo?: string | null;
  /**
   * Exception details. The shape differs by platform:
   * - iOS: a structured object from MetricKit's exception reason, set for
   *   unhandled Objective-C exceptions.
   * - Android: a plain string — the throwable's composed message
   *   (`Throwable.toString()` plus the `Caused by:` chain), set for every JVM
   *   crash.
   *
   * Narrow with `typeof` before reading object fields.
   */
  exceptionReason?:
    | {
        composedMessage: string;
        formatString: string;
        arguments: string[];
        exceptionType: string;
        className: string;
        exceptionName: string;
      }
    | string
    | null;
  callStackTree?: CallStackTree | null;
  /**
   * Id of the session the crash is attributed to, or `null` for an orphan —
   * a startup crash captured before a session existed, or a native crash that
   * couldn't be attributed. Only populated by `getAllCrashReports`.
   * @platform android
   */
  sessionId?: string | null;
  /** App version at the time of the crash. */
  appVersion: string;
  /**
   * Start of the diagnostic window. On iOS this is MetricKit's payload window
   * (typically a 24-hour bucket); on Android the exact crash moment. ISO 8601 —
   * sub-second precision differs between platforms, so parse rather than
   * string-compare.
   */
  timestampBegin: string;
  /**
   * End of the diagnostic window. Present on iOS (the window end). Absent on
   * Android, which captures the exact crash moment — treat a missing value as
   * equal to `timestampBegin` (a zero-width window).
   * @platform ios
   */
  timestampEnd?: string;
  /**
   * When this device learned about the crash and constructed the report —
   * the next launch after the crash, not the crash moment itself.
   */
  ingestedAt: string;
};

/**
 * Snapshot emitted at the moment a request begins. Carries enough information to render the
 * request in an "in-flight" debug UI; the matching completion event arrives later with the
 * same `id`.
 */
export type NetworkRequestStartedEvent = {
  /** Stable identifier shared with the corresponding `requestCompleted` event. */
  id: string;
  /** Request URL as supplied to the native networking layer. May include query parameters and fragments. */
  url: string;
  /** HTTP method (`GET`, `POST`, …). */
  method: string;
  /** ISO 8601 timestamp of when the request started. Truncated to whole seconds. */
  startedAt: string;
};

/**
 * One hop in a redirect chain. `fromUrl` issued the 3xx response, `toUrl` is where it pointed.
 * For a complete chain the first entry's `fromUrl` matches the parent
 * `NetworkRequestCompletedEvent.url`, and the last entry's `toUrl` is where the request
 * actually landed.
 */
export type NetworkRequestRedirect = {
  /** The URL that returned the redirect. */
  fromUrl: string;
  /** The URL the request was redirected to. */
  toUrl: string;
  /** The 3xx status code (301, 302, 307, 308, …) returned by `fromUrl`. */
  statusCode: number;
};

/**
 * Snapshot emitted when a request completes (successfully or otherwise). Shares its `id` with
 * the corresponding `requestStarted` event so consumers can correlate the two.
 */
export type NetworkRequestCompletedEvent = {
  /** Stable identifier shared with the corresponding `requestStarted` event. */
  id: string;
  /** Request URL as supplied to the native networking layer. May include query parameters and fragments. */
  url: string;
  /** HTTP method (`GET`, `POST`, …). */
  method: string;
  /** Response status code, or `null` if the request failed before headers were received. */
  statusCode: number | null;
  /**
   * Negotiated wire protocol (`http/1.1`, `h2`, `h3`), or `null` when the OS didn't report one.
   */
  networkProtocol: string | null;
  /** Total request bytes on the wire (headers + body), or `null` if unavailable. */
  requestBytesSent: number | null;
  /** Total response bytes on the wire (headers + body), or `null` if unavailable. */
  responseBytesReceived: number | null;
  /** Short, human-readable error description if the request failed. */
  errorDescription: string | null;
  /**
   * ISO 8601 timestamp of when the request started (matches `requestStarted.startedAt`).
   * Truncated to whole seconds — use `totalDuration` for sub-second timing.
   */
  startedAt: string | null;
  /**
   * ISO 8601 timestamp of when the response finished arriving. Truncated to whole seconds — use
   * `totalDuration` for sub-second timing.
   */
  completedAt: string | null;
  /** Total wall-clock duration of the request in seconds. */
  totalDuration: number;
  /**
   * Ordered list of redirect hops that preceded the final response. Empty when the request
   * completed without any 3xx redirects.
   */
  redirects: NetworkRequestRedirect[];
};

/**
 * Declares which requests a `NetworkRequestObserver` should emit events for. The filter is
 * evaluated natively, before the request payload crosses into JS, so requests that don't match
 * never materialize a `requestStarted`/`requestCompleted` event.
 *
 * Only request attributes that are known the moment a request starts are supported, so a request
 * that matches always emits both its `requestStarted` and `requestCompleted` events as a pair —
 * the filter decision never changes between the two.
 *
 * A field left unset (`undefined` or `null`) places no constraint on that dimension. A field set
 * to an empty array allows nothing through it, so it drops every request. Different fields combine
 * with AND (host **and** method must match); entries within a single field combine with OR (any
 * listed host matches). A filter with no fields set, or a `null` filter, matches every request.
 */
export type NetworkRequestFilter = {
  /**
   * Allowed hosts, compared for exact, case-insensitive equality against the request URL's host.
   * Subdomains are not implied: `['expo.dev']` matches `expo.dev` but not `api.expo.dev`. List each
   * host you want to observe.
   */
  hosts?: string[] | null;
  /**
   * Allowed HTTP methods (`GET`, `POST`, …), compared case-insensitively.
   */
  methods?: string[] | null;
};

/**
 * Map of events emitted by `NetworkRequestObserver`. Used by the underlying `SharedObject`
 * event-emitter to type listener callbacks.
 */
export type NetworkRequestObserverEvents = {
  requestStarted(event: NetworkRequestStartedEvent): void;
  requestCompleted(event: NetworkRequestCompletedEvent): void;
};

/**
 * Per-instance handle to the network-request stream. Each `new NetworkRequestObserver()` allocates
 * its own SharedObject and registers as a delegate on the native singleton; when JS releases the
 * instance the delegate slot is automatically reclaimed.
 *
 * Subscribe to events via `addListener`/`removeListener` (inherited from the SharedObject base).
 *
 * Pass a `NetworkRequestFilter` to only receive events for matching requests; the filter is
 * applied natively so non-matching payloads never cross into JS. Omit it (or pass `null`) to
 * observe every request.
 *
 * @example
 * ```ts
 * import AppMetrics from 'expo-app-metrics';
 *
 * const observer = new AppMetrics.NetworkRequestObserver({ hosts: ['api.expo.dev'] });
 * const sub = observer.addListener('requestCompleted', event => {
 *   console.log(event.url, event.totalDuration);
 * });
 * // later
 * sub.remove();
 * ```
 */
export declare class NetworkRequestObserver extends SharedObject<NetworkRequestObserverEvents> {
  constructor(filter?: NetworkRequestFilter | null);

  /**
   * Replaces the active filter. Pass `null` to observe every request. The change applies
   * atomically: events already mid-flight are emitted under either the old or the new filter,
   * never a partially-applied mix.
   */
  setFilter(filter: NetworkRequestFilter | null): void;
}

/**
 * A historic session and its recorded data, returned by `getInactiveSessions()`
 * as a plain eager record (not a shared object). Debug-only: intended for
 * inspecting on-device history, not production use.
 *
 * @private This API is unstable, debug-only, and may change without notice.
 */
export type DebugSession = {
  /** Unique identifier (UUID) of the session. */
  id: string;
  /** Kind of session. */
  type: SessionType;
  /** ISO 8601 timestamp of when the session started. */
  startDate: string;
  /** ISO 8601 timestamp of when the session ended, or `null`/absent while active. */
  endDate?: string | null;
  /** Metrics recorded during the session. */
  metrics: Metric[];
  /** Log events recorded during the session. */
  logs: LogRecord[];
  /** Crash report attached to the session, if any. */
  crashReport?: CrashReport | null;
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
  /**
   * Sets attributes merged into every subsequent metric and log event.
   * Per-record keys win on collision. Pass `null`, `undefined`, or an empty
   * object to clear.
   *
   * @example
   * ```ts
   * AppMetrics.setGlobalAttributes({
   *   subscription_tier: 'pro',
   *   experiment_variant: 'B',
   * });
   * ```
   */
  setGlobalAttributes(attributes?: Record<string, LogAttributeValue> | null): void;
  clearStoredEntries(): Promise<void>;
  /**
   * Returns the recorded sessions as plain `Session` records, ordered with
   * the most recent first. Each record eagerly includes its metrics, logs, and
   * crash report.
   *
   * Debug-only: intended for inspecting on-device history (e.g. the
   * ObserveTester app), not for production use.
   *
   * @private This API is unstable and may change without notice.
   */
  getInactiveSessions(): Promise<DebugSession[]>;

  /**
   * Returns every stored crash report, ordered with the most recent first.
   * Includes reports attributed to a session as well as orphans — startup
   * crashes captured before a session existed, or native crashes that couldn't
   * be attributed. Orphans have a `sessionId` of `null`.
   *
   * Debug-only: intended for inspecting on-device history, not for production use.
   *
   * @private This API is unstable and may change without notice.
   * @platform android
   */
  getAllCrashReports?: () => Promise<CrashReport[]>;

  /**
   * Reports an unhandled JavaScript error, recorded natively as an `exception` log event following
   * OpenTelemetry's exception conventions. Called by the global `ErrorUtils` handler that
   * `installErrorHandler` installs and by `AppMetricsErrorBoundary`; the `source` field records
   * which path captured the error.
   *
   * @private This API is unstable and may change without notice.
   */
  reportError(error: {
    source: 'global' | 'errorBoundary' | 'reportedByUser';
    type?: string;
    message: string;
    stacktrace?: string;
    /**
     * The React component stack of the subtree that threw, available only for errors caught by an
     * error boundary. Recorded as the `expo.error.component_stack` attribute.
     */
    componentStack?: string;
    isFatal: boolean;
  }): void;

  /**
   * Returns the main session — the per-launch session that tracks the entire
   * app process — as a shared object built from in-memory state, so the call
   * is synchronous and never returns `null`. Metrics and logs are fetched
   * lazily via the returned object.
   *
   * The returned object is a static reference: repeated calls return the same
   * object while it stays referenced, so `getMainSession() === getMainSession()`.
   *
   * @private This API is unstable and may change without notice.
   */
  getMainSession(): Session;

  /**
   * Resolves to the current foreground session — created when the app becomes
   * active and ended when it is backgrounded — as a shared object, or `null`
   * when no foreground session is active. Metrics and logs are fetched lazily
   * via the returned object.
   *
   * @private This API is unstable and may change without notice.
   * @platform ios
   */
  getForegroundSession(): Promise<Session | null>;

  /**
   * Class for subscribing to HTTP requests observed by the native networking interceptor.
   * Construct an instance to begin receiving `requestStarted`/`requestCompleted` events;
   * release the instance (drop all references) to stop.
   */
  NetworkRequestObserver: typeof NetworkRequestObserver;

  /**
   * Native `Session` shared-object class (live main/foreground sessions).
   * Exposed so the web module can substitute its own implementation; not
   * intended to be constructed from user code.
   *
   * @private This API is unstable and may change without notice.
   */
  Session: typeof Session;
}
