import EXUpdatesInterface
import ExpoModulesCore
import Foundation

internal let logger = Logger(logHandlers: [createOSLogHandler(category: Logger.EXPO_LOG_CATEGORY)])

@ExpoModule("ExpoAppMetrics", classes: [SpanHandle.self])
public final class AppMetricsModule: Module, UpdatesStateChangeListener {
  var subscription: UpdatesStateChangeSubscription?

  public func definition() -> ModuleDefinition {
    OnCreate {
      AppMetricsActor.isolated {
        AppMetrics.mainSession.updatesMonitor.patchAppInfoIfNeeded()
      }
      if let updatesController = UpdatesControllerRegistry.sharedInstance.controller {
        subscription = updatesController.subscribeToUpdatesStateChanges(self)
      }
    }

    OnDestroy {
      subscription?.remove()
    }

    Function("markFirstRender") {
      AppMetrics.mainSession.appStartupMonitor.markFirstRender()
    }

    Function("markInteractive") { (attributes: MetricAttributes?) in
      AppMetrics.mainSession.appStartupMonitor.markInteractive(
        routeName: attributes?.routeName,
        params: attributes?.params ?? [:]
      )
    }

    // TODO(@ubax): move `logEvent` onto the Session shared object so logs are recorded via a
    // session handle (like `addMetric`), instead of writing to `mainSession` directly here.
    Function("logEvent") { (name: String, options: LogEventOptions?) in
      guard let validatedName = validateEventName(name) else {
        return
      }
      let validatedBody = validateEventBody(options?.body)
      let sanitized = sanitizeLogEventAttributes(options?.attributes)
      let attributes = withDisplayNameAttribute(
        sanitized.attributes,
        displayName: validateDisplayName(options?.displayName)
      )
      // Globals merge happens in `LogRow.from` so every persistence path picks them up.
      let record = LogRecord(
        name: validatedName,
        body: validatedBody,
        attributes: attributes,
        droppedAttributesCount: sanitized.droppedCount,
        severity: options?.severity ?? .info
      )

      AppMetricsActor.isolated {
        AppMetrics.mainSession.receiveLog(record)
      }
    }

    Function("setGlobalAttributes") { (attributes: [String: Any]?) in
      GlobalAttributes.set(attributes)
    }

    Function("setNetworkTracesConfig") { (config: NetworkTracesConfigParam) in
      let configuration = NetworkTracesConfiguration(
        enabled: config.enabled,
        hosts: config.filter?.hosts,
        methods: config.filter?.methods
      )
      // Persisted before the hop, so a configure racing startup is either read from
      // `UserDefaults` by the installing producer or applied to the live one below.
      AppMetricsUserDefaults.networkTracesConfiguration = configuration
      AppMetricsActor.isolated {
        // Re-read rather than captured: actor hops are unordered, so two rapid calls could
        // otherwise apply out of order. Android captures, since its queue is a single thread.
        let latest = AppMetricsUserDefaults.networkTracesConfiguration ?? NetworkTracesConfiguration()
        NetworkRequestMonitor.shared.persistence?.setConfiguration(latest)
      }
    }

    AsyncFunction("getAppStartupTimesAsync") {
      return await AppMetrics.mainSession.appStartupMonitor.metrics
    }

    AsyncFunction("getMemoryUsageSnapshotAsync") {
      return try await AppMetricsActor.isolated {
        return MemoryUsageSnapshot.getCurrent()
      }
    }

    AsyncFunction("getFrameRateMetricsAsync") {
      return await AppMetrics.mainSession.frameMetricsRecorder.metrics
    }

    AsyncFunction("clearStoredEntries") {
      // no-op
    }

    // Debug-only: the inactive (ended) sessions
    AsyncFunction("getInactiveSessions") { () -> [StoredSession] in
      return try await AppMetricsActor.isolated {
        return try AppMetrics.database?
          .getInactiveSessionsWithChildren()
          .map { StoredSession(from: $0) } ?? []
      }.value
    }

    AsyncFunction("addCustomMetricToSession") { (jsMetric: JsMetric) in
      try await AppMetricsActor.isolated {
        let metric = jsMetric.toMetric()
        try AppMetrics.database?.insert(metric: MetricRow.from(metric: metric, sessionId: jsMetric.sessionId))
      }.value
    }

    // Synchronous and never nil: the main session is the process-lifetime singleton, always
    // available. It's a `SharedObject`, so returning the same instance hands JS the identical shared
    // object on every call (`getMainSession() === getMainSession()`).
    Function("getMainSession") { () -> Session in
      return AppMetrics.mainSession
    }

    // Returns the current foreground session, or `nil` when the app is not in the foreground.
    // Reads the actor-isolated `foregroundSession`, so it's async. The instance is the shared object
    // itself, so JS gets the same object while the session is current and a new one after it rotates.
    AsyncFunction("getForegroundSession") { () -> Session? in
      return try await AppMetricsActor.isolated { AppMetrics.foregroundSession }.value
    }

    Class("Session", Session.self) {
      Property("id") { $0.id }
      Property("type") { $0.type.rawValue }
      Property("startDate") { $0.startDate.ISO8601Format() }

      AsyncFunction("isActive") { (session: Session) -> Bool in
        return try await AppMetricsActor.isolated { session.isActive }.value
      }

      AsyncFunction("getEndDate") { (session: Session) -> String? in
        return try await AppMetricsActor.isolated { session.endDate?.ISO8601Format() }.value
      }

      AsyncFunction("getMetrics") { (session: Session) -> [Metric] in
        return try await AppMetricsActor.isolated { try session.getMetrics() }.value
      }

      AsyncFunction("getLogs") { (session: Session) -> [LogRecord] in
        return try await AppMetricsActor.isolated { try session.getLogs() }.value
      }

      AsyncFunction("addMetric") { (session: Session, input: SessionMetricInput) in
        try await AppMetricsActor.isolated { try session.addMetric(input) }.value
      }
    }

    // Records an unhandled JavaScript error captured by the JS-side `global.ErrorUtils` handler as a
    // log event. The JS layer owns capture (and chaining to the previous handler).
    //
    // A fatal error terminates the process right after this returns, so we can't let the async actor
    // write race the shutdown. We write it to disk synchronously here (on the JS thread, no actor/DB)
    // and ingest it on the next launch. Non-fatal errors aren't racing termination, so they go through
    // the normal async log path.
    Function("reportError") { (report: ErrorReport) in
      if report.isFatal {
        PendingErrorStore.write(report.toPendingError(sessionId: AppMetrics.mainSession.id))
      } else {
        AppMetricsActor.isolated {
          AppMetrics.mainSession.receiveLog(report.toLogRecord())
        }
      }
    }

    Class(NetworkRequestObserver.self) {
      Constructor { (filter: NetworkRequestFilter?) in
        return NetworkRequestObserver(filter: filter)
      }

      Function("setFilter") { (observer: NetworkRequestObserver, filter: NetworkRequestFilter?) in
        observer.setFilter(filter)
      }
    }

    Function("startSpan") { (name: String, options: StartSpanOptions?, parent: SpanHandle?) -> SpanHandle in
      let validatedName = validatedSpanName(name)
      let recorder = SpanRecorder(
        name: validatedName ?? name,
        sessionId: AppMetrics.mainSession.id,
        parentTraceId: parent?.recorder.traceId,
        parentSpanId: parent?.recorder.spanId,
        attributes: options?.attributes,
        startTimestampMs: resolvedTimestamp(options?.startTime, field: "startTime")
      )
      // A span with an invalid name still works for the caller, including as a parent, but it
      // is never written.
      let onEnd: @Sendable (SpanRow) -> Void
      if validatedName == nil {
        onEnd = { _ in }
      } else {
        onEnd = AppMetrics.spanWriter.schedule
      }
      return SpanHandle(recorder: recorder, onEnd: onEnd)
    }

    Function("recordSpan") { (name: String, options: RecordSpanOptions, parent: SpanHandle?) in
      guard let validatedName = validatedSpanName(name),
        let window = recordedSpanWindow(startTime: options.startTime, endTime: options.endTime)
      else {
        return
      }
      // One code path with `startSpan`: an ephemeral recorder validates the attributes and
      // produces the same write-once row shape.
      let recorder = SpanRecorder(
        name: validatedName,
        sessionId: AppMetrics.mainSession.id,
        parentTraceId: parent?.recorder.traceId,
        parentSpanId: parent?.recorder.spanId,
        attributes: options.attributes,
        startTimestampMs: window.start,
        attributeSource: "recordSpan"
      )
      if let row = recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: window.end) {
        AppMetrics.spanWriter.schedule(row)
      }
    }
  }

  public func updatesStateDidChange(_ event: [String: Any]) {
    // `OnCreate` can run before `EnabledAppController.start()` assigns its startup procedure, in
    // which case the launched update reads as nil and `AppInfo` keeps the embedded build's
    // attribution for the rest of the session. Retry here: by the time any state change arrives
    // the launched update is known, and the patch no-ops once an id has been recorded.
    AppMetricsActor.isolated {
      AppMetrics.mainSession.updatesMonitor.patchAppInfoIfNeeded()
    }

    if UpdatesStateEvent.fromDict(event)?.type ?? .restart == .downloadCompleteWithUpdate,
      let metric = AppMetrics.mainSession.updatesMonitor.downloadTimeMetric(subscription)
    {
      Task { @AppMetricsActor in
        AppMetrics.mainSession.updatesMonitor.reportMetric(metric)
      }
    }
  }
}

// Loads a session and its children from the database and wraps it as a `StoredSession`,
// returning `nil` when the database is unavailable or the session no longer exists.
@AppMetricsActor
private func storedSession(id: String) throws -> StoredSession? {
  guard let row = try AppMetrics.database?.getSessionWithChildren(id: id) else {
    return nil
  }
  return StoredSession(from: row)
}

/// Payload of `setNetworkTracesConfig`: the normalized `networkTraces` setting pushed down by
/// `Observe.configure`.
@Record
internal struct NetworkTracesConfigParam {
  var enabled: Bool = true
  var filter: NetworkRequestFilter?
}

internal struct StartSpanOptions: Record {
  @Field
  var attributes: [String: Any]?

  /// Unix-epoch milliseconds overriding "now" as the span start.
  @Field
  var startTime: Double?
}

internal struct SpanEventOptions: Record {
  @Field
  var attributes: [String: Any]?

  /// Unix-epoch milliseconds overriding "now" as the event time.
  @Field
  var time: Double?
}

internal struct SpanEndOptions: Record {
  /// `"ok"` or `"error"`. Omitted means UNSET, per the conventions; any other value warns and
  /// also means UNSET.
  @Field
  var status: String?

  @Field
  var message: String?

  /// Unix-epoch milliseconds overriding "now" as the span end.
  @Field
  var endTime: Double?
}

internal struct RecordSpanOptions: Record {
  @Field
  var startTime: Double?

  @Field
  var endTime: Double?

  @Field
  var attributes: [String: Any]?
}

/// Validates a caller-provided span name with the rules `validateEventName` applies to log events.
/// Returns `nil` and warns when the name is invalid, so the caller doesn't record the span.
internal func validatedSpanName(_ name: String) -> String? {
  let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
  guard !trimmed.isEmpty else {
    logger.warn(
      "[AppMetrics] A span with an empty name is not recorded. Pass a short, stable identifier for the operation being measured, like 'checkout' or 'image-decode'."
    )
    return nil
  }
  guard !trimmed.hasPrefix(reservedEventNamePrefix) else {
    logger.warn(
      "[AppMetrics] The span `\(trimmed)` is not recorded because the `expo.` prefix is reserved for spans the SDK records, like network requests. Pick a name from your own namespace, like 'checkout' or 'image-decode'."
    )
    return nil
  }
  guard trimmed.count <= maxEventNameLength else {
    logger.warn(
      "[AppMetrics] A span with a \(trimmed.count)-character name is not recorded because the limit is \(maxEventNameLength) characters. Use a short, stable identifier and move the variable details into attributes."
    )
    return nil
  }
  return trimmed
}

/// Maps the JS `status` option to the OTLP status code. `nil` stays UNSET, and an unknown value
/// warns and stays UNSET too.
internal func spanStatusCode(from status: String?) -> Int? {
  switch status {
  case nil:
    return nil
  case "ok":
    return SpanRow.statusOk
  case "error":
    return SpanRow.statusError
  case .some(let other):
    logger.warn(
      "[AppMetrics] Ignoring the span status '\(other)', so the span ends with an unset status. Pass 'error' for a failed operation, 'ok' to explicitly mark success, or omit the status."
    )
    return nil
  }
}

internal func currentUnixMilliseconds() -> Int64 {
  return Int64((Date().timeIntervalSince1970 * 1_000).rounded())
}

/// The earliest timestamp accepted from JavaScript, 2001-09-09T01:46:40Z. A smaller value almost
/// always comes from the wrong clock or is in the wrong unit: `performance.now()` measures uptime,
/// and a timestamp in seconds is 1000 times too small.
internal let minTimestampMs: Int64 = 1_000_000_000_000

/// How far past the current time a timestamp from JavaScript may be. A later value almost always
/// is in the wrong unit, such as microseconds.
internal let maxTimestampAheadMs: Int64 = 24 * 60 * 60 * 1_000

/// Resolves a caller-supplied timestamp, falling back to now when it is missing or unusable.
///
/// An unusable value warns rather than passing silently: substituting now would otherwise record
/// a plausible-looking span whose window the caller never chose.
internal func resolvedTimestamp(_ value: Double?, field: String) -> Int64 {
  guard let value else {
    return currentUnixMilliseconds()
  }
  guard let milliseconds = unixMilliseconds(from: value) else {
    logger.warn(
      "[AppMetrics] Ignoring `\(field)`: \(value) is not a unix-epoch timestamp in milliseconds. Values from `performance.now()` and timestamps in seconds or microseconds are common causes. Using the current time instead; pass a value from `Date.now()`."
    )
    return currentUnixMilliseconds()
  }
  return milliseconds
}

/// Converts a required `recordSpan` timestamp. Returns `nil` and warns when it is missing or
/// unusable, so the caller drops the span.
internal func requiredTimestamp(_ value: Double?, field: String) -> Int64? {
  guard let value else {
    logger.warn(
      "[AppMetrics] recordSpan received no `\(field)`, so the span is not recorded. It needs both startTime and endTime (unix-epoch milliseconds) because it records an already-measured operation. To time an operation as it runs, use startSpan() and end() instead."
    )
    return nil
  }
  guard let milliseconds = unixMilliseconds(from: value) else {
    logger.warn(
      "[AppMetrics] recordSpan received \(value) as `\(field)`, which is not a unix-epoch timestamp in milliseconds, so the span is not recorded. Values from `performance.now()` and timestamps in seconds or microseconds are common causes. Pass a value from `Date.now()`."
    )
    return nil
  }
  return milliseconds
}

/// Unix-epoch milliseconds from a JS number, or `nil` when the value can't be one: NaN, infinity,
/// a value before `minTimestampMs`, or one more than `maxTimestampAheadMs` after `now`.
internal func unixMilliseconds(from value: Double, now: Int64 = currentUnixMilliseconds()) -> Int64? {
  // `Int64(exactly:)` rather than a range comparison: `Double(Int64.max)` rounds up to 2^63, so
  // `value <= Double(Int64.max)` would admit the one value the conversion traps on.
  guard let milliseconds = Int64(exactly: value.rounded(.towardZero)) else {
    return nil
  }
  guard milliseconds >= minTimestampMs, milliseconds <= now + maxTimestampAheadMs else {
    return nil
  }
  return milliseconds
}

/// The measured window of a `recordSpan` call. Returns `nil` and warns when a time is missing or
/// unusable, or when the window ends before it starts, so the caller drops the span.
internal func recordedSpanWindow(startTime: Double?, endTime: Double?) -> (start: Int64, end: Int64)? {
  guard let start = requiredTimestamp(startTime, field: "startTime"),
    let end = requiredTimestamp(endTime, field: "endTime")
  else {
    return nil
  }
  guard end >= start else {
    logger.warn(
      "[AppMetrics] recordSpan received an endTime before its startTime, so the span is not recorded. Check that both times come from `Date.now()` and are passed in the right order."
    )
    return nil
  }
  return (start, end)
}

struct MetricAttributes: Record {
  @Field var routeName: String?
  @Field var params: [String: Any]?
}
