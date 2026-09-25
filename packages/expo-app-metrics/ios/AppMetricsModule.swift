import EXUpdatesInterface
import ExpoModulesCore
import Foundation

internal let logger = Logger(logHandlers: [createOSLogHandler(category: Logger.EXPO_LOG_CATEGORY)])

public final class AppMetricsModule: Module, UpdatesStateChangeListener {
  var subscription: UpdatesStateChangeSubscription?

  public func definition() -> ModuleDefinition {
    Name("ExpoAppMetrics")

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
      let recorder = SpanRecorder(
        name: try validatedSpanName(name),
        sessionId: AppMetrics.mainSession.id,
        parentTraceId: parent?.recorder.traceId,
        parentSpanId: parent?.recorder.spanId,
        attributes: options?.attributes,
        startTimestampMs: options?.startTime.flatMap(unixMilliseconds(from:)) ?? currentUnixMilliseconds()
      )
      return SpanHandle(recorder: recorder, onEnd: AppMetrics.spanWriter.schedule)
    }

    Function("recordSpan") { (name: String, options: RecordSpanOptions) in
      guard
        let start = options.startTime.flatMap(unixMilliseconds(from:)),
        let end = options.endTime.flatMap(unixMilliseconds(from:))
      else {
        throw MissingSpanWindowException()
      }
      // One code path with `startSpan`: an ephemeral recorder validates the attributes and
      // produces the same write-once row shape.
      let recorder = SpanRecorder(
        name: try validatedSpanName(name),
        sessionId: AppMetrics.mainSession.id,
        attributes: options.attributes,
        startTimestampMs: start
      )
      if let row = recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: end) {
        AppMetrics.spanWriter.schedule(row)
      }
    }

    Class("Span", SpanHandle.self) {
      Constructor { () -> SpanHandle in
        throw SpanConstructorUnavailableException()
      }

      Property("traceId") { (span: SpanHandle) in
        return span.recorder.traceId
      }

      Property("spanId") { (span: SpanHandle) in
        return span.recorder.spanId
      }

      Function("setAttributes") { (span: SpanHandle, attributes: [String: Any]) in
        span.recorder.setAttributes(attributes)
      }

      Function("addEvent") { (span: SpanHandle, name: String, options: SpanEventOptions?) in
        span.recorder.addEvent(
          name: name,
          attributes: options?.attributes,
          timeMs: options?.time.flatMap(unixMilliseconds(from:)) ?? currentUnixMilliseconds()
        )
      }

      Function("end") { (span: SpanHandle, options: SpanEndOptions?) in
        span.end(
          statusCode: try spanStatusCode(from: options?.status),
          statusMessage: options?.message,
          endTimestampMs: options?.endTime.flatMap(unixMilliseconds(from:)) ?? currentUnixMilliseconds()
        )
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
  /// `"ok"` or `"error"`; anything else throws. Omitted means UNSET, per the conventions.
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

/// Validates a caller-provided span name, applying the rules `validateEventName` applies to log
/// events. Unlike `logEvent`, which drops a bad record, `startSpan` has to return a handle, so a
/// rejection throws instead.
private func validatedSpanName(_ name: String) throws -> String {
  let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
  guard !trimmed.isEmpty else {
    throw EmptySpanNameException()
  }
  guard !trimmed.hasPrefix(reservedEventNamePrefix) else {
    throw ReservedSpanNameException(trimmed)
  }
  guard trimmed.count <= maxEventNameLength else {
    throw SpanNameTooLongException(trimmed.count)
  }
  return trimmed
}

/// Maps the JS `status` option to the OTLP status code. `nil` stays UNSET.
private func spanStatusCode(from status: String?) throws -> Int? {
  switch status {
  case nil:
    return nil
  case "ok":
    return SpanRow.statusOk
  case "error":
    return SpanRow.statusError
  case .some(let other):
    throw InvalidSpanStatusException(other)
  }
}

private func currentUnixMilliseconds() -> Int64 {
  return Int64((Date().timeIntervalSince1970 * 1_000).rounded())
}

/// Unix-epoch milliseconds from a JS number, or `nil` when the value can't be one.
///
/// `Int64(_:)` traps on NaN, infinity, and anything outside its range, and JS hands all three
/// over as ordinary numbers (`Number(header)` is NaN when the header is missing). Android's
/// `toLong()` saturates instead, so clamping here also keeps the platforms in step.
private func unixMilliseconds(from value: Double) -> Int64? {
  guard value.isFinite, value >= Double(Int64.min), value <= Double(Int64.max) else {
    return nil
  }
  return Int64(value)
}

internal final class EmptySpanNameException: Exception {
  override var reason: String {
    "A span needs a non-empty name because the server rejects nameless spans. Pass a short, stable identifier for the operation being measured, like 'checkout' or 'image-decode'."
  }
}

internal final class InvalidSpanStatusException: GenericException<String> {
  override var reason: String {
    "'\(param)' is not a valid span status. Pass 'error' for a failed operation, 'ok' to explicitly mark success, or omit the status to leave it unset (the usual choice for successful spans)."
  }
}

internal final class ReservedSpanNameException: GenericException<String> {
  override var reason: String {
    "A span name can't start with `expo.` (got `\(param)`) because that prefix is reserved for spans the SDK itself records, like network requests. Pick a name from your own namespace, like 'checkout' or 'image-decode'."
  }
}

internal final class SpanNameTooLongException: GenericException<Int> {
  override var reason: String {
    "A span name can't exceed \(maxEventNameLength) characters (got \(param)) because the server rejects longer ones. Use a short, stable identifier and move the variable details into attributes."
  }
}

internal final class MissingSpanWindowException: Exception {
  override var reason: String {
    "recordSpan needs both startTime and endTime (unix-epoch milliseconds) because it records an already-measured operation. To time an operation as it runs, use startSpan() and end() instead."
  }
}

internal final class SpanConstructorUnavailableException: Exception {
  override var reason: String {
    "Span objects can't be constructed directly because a span's identity and session attribution are assigned natively at start time. Get one from AppMetrics.startSpan() instead."
  }
}

struct MetricAttributes: Record {
  @Field var routeName: String?
  @Field var params: [String: Any]?
}
