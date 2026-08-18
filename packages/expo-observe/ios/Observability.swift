import EASClient
import ExpoAppMetrics
import ExpoModulesCore

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var metricsEndpointUrl: URL? = nil
  private static var logsEndpointUrl: URL? = nil
  private static var tracesEndpointUrl: URL? = nil
  private static var projectId: String? = nil

  /// Maximum spans per request accepted by the ingestion endpoint; it rejects everything past
  /// this count within one POST, so larger backlogs are sent as sequential chunks.
  internal static let maxSpansPerRequest = 512

  /// In-memory retry-gate state, kept independently per OTLP endpoint. The `/v1/metrics` and
  /// `/v1/logs` endpoints fail independently in practice (e.g., one schema validation
  /// disagreement on the metrics side shouldn't suppress a healthy logs stream), so each
  /// signal carries its own consecutive-failure counter and dispatch-after deadline. A single
  /// shared field would conflate the two: a recovering signal would reset the other's
  /// counter on success, and a server's `Retry-After` on one endpoint would silently
  /// overwrite a longer backoff computed for the other.
  ///
  /// State is reset implicitly when the process restarts — a relaunch usually means enough
  /// time passed that the transient cause has cleared anyway, and persisting the gates would
  /// mean a UserDefaults write per retryable response.
  private static var metricsRetryGate: DispatchUtils.RetryGateState = .initial
  private static var logsRetryGate: DispatchUtils.RetryGateState = .initial
  private static var tracesRetryGate: DispatchUtils.RetryGateState = .initial

  /// Whether a dispatch pass is currently running. The actor is reentrant at every network
  /// `await`, so overlapping `dispatch()` calls (a JS `dispatchEvents` racing the resign-active
  /// app delegate hook) would otherwise read — and send — the same pending rows twice before
  /// either pass advances its cursor or deletes its batch.
  private static var isDispatching = false

  internal static func dispatch() async {
    if isDispatching {
      observeLogger.debug("[EAS Observe] Dispatch already in progress; skipping")
      return
    }
    isDispatching = true
    defer {
      isDispatching = false
    }

    // Per-signal gates are checked inside `dispatchMetrics` / `dispatchLogs` / `dispatchTraces`
    // rather than here, so a backoff on one endpoint doesn't suppress the others' traffic.
    let shouldDispatch = Self.shouldDispatch()

    await dispatchMetrics(shouldDispatch: shouldDispatch)
    await dispatchLogs(shouldDispatch: shouldDispatch)
    await dispatchTraces(shouldDispatch: shouldDispatch)
  }

  /// Whether a per-signal retry gate currently blocks dispatch on that signal. Logs a debug
  /// line at the dispatch entry point if so, mirroring the previous top-of-dispatch check.
  private static func retryGateBlocks(_ state: DispatchUtils.RetryGateState, signal: String) -> Bool {
    guard let until = state.dispatchAfterDate, until > Date() else {
      return false
    }
    observeLogger.debug(
      "[EAS Observe] \(signal) dispatch suppressed by retry gate until \(until)"
    )
    return true
  }

  /// Applies a per-signal dispatch outcome to one of the retry-gate fields. The `inout`
  /// parameter binding keeps the metrics and logs paths from accidentally sharing state.
  /// Mirrors the pure `DispatchUtils.nextRetryGateState(...)` and is called from both
  /// `dispatchMetrics` and `dispatchLogs` after each `DispatchUtils.sendRequest(...)` call.
  private static func applyRetryOutcome(
    _ result: DispatchResult,
    to state: inout DispatchUtils.RetryGateState
  ) {
    state = DispatchUtils.nextRetryGateState(
      result: result,
      currentState: state,
      now: Date(),
      backoff: { DispatchUtils.computeBackoffDelay(attempt: $0) }
    )
  }

  private static func dispatchMetrics(shouldDispatch: Bool) async {
    if retryGateBlocks(metricsRetryGate, signal: "metrics") {
      return
    }

    repairMetricCursorIfStale()

    let cursor = ObserveUserDefaults.lastDispatchedMetricId
    let pendingMetrics: [MetricRow]
    do {
      pendingMetrics = try AppMetrics.getMetrics(afterId: cursor)
    } catch {
      observeLogger.warn("[EAS Observe] Failed to read pending metrics: \(error.localizedDescription)")
      return
    }
    guard !pendingMetrics.isEmpty, let endpointUrl = metricsEndpointUrl else {
      observeLogger.debug("[EAS Observe] No new metrics to dispatch")
      return
    }
    let highestId = pendingMetrics.last?.id ?? cursor
    if !shouldDispatch {
      ObserveUserDefaults.lastDispatchedMetricId = highestId
      return
    }
    let events: [Event]
    do {
      events = try buildEvents(forMetrics: pendingMetrics)
    } catch {
      observeLogger.warn("[EAS Observe] Failed to assemble metric events: \(error.localizedDescription)")
      return
    }
    if events.isEmpty {
      ObserveUserDefaults.lastDispatchedMetricId = highestId
      return
    }
    let body = OTRequestBody(resourceMetrics: events.map { $0.toOTEvent(easClientId) })
    let result = await DispatchUtils.sendRequest(to: endpointUrl, body: body)
    applyRetryOutcome(result, to: &metricsRetryGate)
    ObserveUserDefaults.lastDispatchedMetricId = DispatchUtils.nextCursor(
      for: result,
      currentCursor: cursor,
      highestId: highestId
    )
    switch result {
    case .success:
      ObserveUserDefaults.lastDispatchDate = Date.now
    case .partialSuccess(let partial):
      ObserveUserDefaults.lastDispatchDate = Date.now
      observeLogger.warn(
        "[EAS Observe] Partial success on batch of \(events.count) metric event(s) past "
          + "id \(highestId): server rejected \(partial.rejectedCount) "
          + "(\(partial.errorMessage ?? "no error message"))"
      )
    case .retryableFailure:
      break
    case .nonRetryableFailure(let reason):
      observeLogger.warn(
        "[EAS Observe] Dropping batch of \(events.count) metric event(s) past id "
          + "\(highestId): \(reason)"
      )
    }
  }

  private static func dispatchLogs(shouldDispatch: Bool) async {
    if retryGateBlocks(logsRetryGate, signal: "logs") {
      return
    }

    repairLogCursorIfStale()

    let cursor = ObserveUserDefaults.lastDispatchedLogId
    let pendingLogs: [LogRow]
    do {
      pendingLogs = try AppMetrics.getLogs(afterId: cursor)
    } catch {
      observeLogger.warn("[EAS Observe] Failed to read pending logs: \(error.localizedDescription)")
      return
    }
    guard !pendingLogs.isEmpty, let endpointUrl = logsEndpointUrl else {
      observeLogger.debug("[EAS Observe] No new logs to dispatch")
      return
    }
    let highestId = pendingLogs.last?.id ?? cursor
    if !shouldDispatch {
      ObserveUserDefaults.lastDispatchedLogId = highestId
      return
    }
    let events: [Event]
    do {
      events = try buildEvents(forLogs: pendingLogs)
    } catch {
      observeLogger.warn("[EAS Observe] Failed to assemble log events: \(error.localizedDescription)")
      return
    }
    let resourceLogs = events.compactMap { event -> OTResourceLogs? in
      guard !event.logs.isEmpty else {
        return nil
      }
      return event.toOTResourceLogs(easClientId)
    }
    if resourceLogs.isEmpty {
      ObserveUserDefaults.lastDispatchedLogId = highestId
      return
    }
    let body = OTLogsRequestBody(resourceLogs: resourceLogs)
    let result = await DispatchUtils.sendRequest(to: endpointUrl, body: body)
    applyRetryOutcome(result, to: &logsRetryGate)
    ObserveUserDefaults.lastDispatchedLogId = DispatchUtils.nextCursor(
      for: result,
      currentCursor: cursor,
      highestId: highestId
    )
    switch result {
    case .success, .retryableFailure:
      ObserveUserDefaults.lastDispatchDate = Date.now
    case .partialSuccess(let partial):
      ObserveUserDefaults.lastDispatchDate = Date.now
      observeLogger.warn(
        "[EAS Observe] Partial success on batch of \(resourceLogs.count) log event(s) past "
          + "id \(highestId): server rejected \(partial.rejectedCount) "
          + "(\(partial.errorMessage ?? "no error message"))"
      )
    case .nonRetryableFailure(let reason):
      observeLogger.warn(
        "[EAS Observe] Dropping batch of \(resourceLogs.count) log event(s) past id "
          + "\(highestId): \(reason)"
      )
    }
  }

  /// Dispatches persisted spans to `/v1/traces`.
  ///
  /// Unlike metrics and logs there is no persisted cursor: nothing else reads the `spans` rows
  /// back, so a consumed (or deliberately dropped) batch is deleted outright and the table
  /// itself acts as the queue. Rows survive on a retryable failure and go out on the next
  /// dispatch.
  private static func dispatchTraces(shouldDispatch: Bool) async {
    guard let endpointUrl = tracesEndpointUrl else {
      // Without a project id there is nowhere to send spans, so skip even the table read —
      // this path runs on every resign-active in apps without EAS config, and the pending
      // rows are already bounded by the insert-time cap.
      return
    }
    if retryGateBlocks(tracesRetryGate, signal: "traces") {
      return
    }
    if !shouldDispatch {
      // Drop the backlog without materializing it; one SELECT MAX is enough to know how far
      // to delete. Mirrors metrics/logs advancing their cursor past rows they won't send.
      do {
        if let maxId = try AppMetrics.getMaxSpanId() {
          try AppMetrics.deleteSpans(upToId: maxId)
        }
      } catch {
        observeLogger.warn("[EAS Observe] Failed to drop undispatched spans: \(error.localizedDescription)")
      }
      return
    }

    let pendingSpans: [SpanRow]
    do {
      pendingSpans = try AppMetrics.getSpans(afterId: -1)
    } catch {
      observeLogger.warn("[EAS Observe] Failed to read pending spans: \(error.localizedDescription)")
      return
    }
    guard !pendingSpans.isEmpty else {
      observeLogger.debug("[EAS Observe] No new spans to dispatch")
      return
    }

    // The endpoint rejects spans past `maxSpansPerRequest` per POST, so a larger backlog goes
    // out as sequential chunks. Rows arrive ordered by id; a chunk that fails retryably stops
    // the loop and leaves its rows (and everything after them) for the next dispatch.
    for chunkStart in stride(from: 0, to: pendingSpans.count, by: maxSpansPerRequest) {
      let chunk = Array(pendingSpans[chunkStart..<min(chunkStart + maxSpansPerRequest, pendingSpans.count)])
      let resourceSpans: [OTResourceSpans]
      do {
        resourceSpans = try buildResourceSpans(forSpans: chunk)
      } catch {
        observeLogger.warn("[EAS Observe] Failed to assemble trace events: \(error.localizedDescription)")
        return
      }
      if resourceSpans.isEmpty {
        deleteDispatchedSpans(upToId: chunk.last?.id)
        continue
      }
      let body = OTTracesRequestBody(resourceSpans: resourceSpans)
      let result = await DispatchUtils.sendRequest(to: endpointUrl, body: body)
      applyRetryOutcome(result, to: &tracesRetryGate)
      switch result {
      case .success:
        ObserveUserDefaults.lastDispatchDate = Date.now
      case .partialSuccess(let partial):
        ObserveUserDefaults.lastDispatchDate = Date.now
        observeLogger.warn(
          "[EAS Observe] Partial success on batch of \(chunk.count) span(s): "
            + "server rejected \(partial.rejectedCount) "
            + "(\(partial.errorMessage ?? "no error message"))"
        )
      case .retryableFailure:
        return
      case .nonRetryableFailure(let reason):
        observeLogger.warn(
          "[EAS Observe] Dropping batch of \(chunk.count) span(s): \(reason)"
        )
      }
      // Reached on success, partial success, and non-retryable failure — all outcomes after
      // which the batch must not be sent again.
      deleteDispatchedSpans(upToId: chunk.last?.id)
    }
  }

  private static func deleteDispatchedSpans(upToId: Int64?) {
    guard let upToId else {
      return
    }
    do {
      try AppMetrics.deleteSpans(upToId: upToId)
    } catch {
      observeLogger.warn("[EAS Observe] Failed to delete dispatched spans: \(error.localizedDescription)")
    }
  }

  /// Groups `rows` by session id, hydrates the matching session rows, and emits one value per
  /// session via `transform`. Shared by the metrics, logs, and traces builders so session
  /// hydration behaves identically across the three signals. Rows whose session no longer
  /// exists are skipped.
  private static func buildPerSession<Row, T>(
    _ rows: [Row],
    sessionId: (Row) -> String,
    transform: (SessionRow, [Row]) -> T?
  ) throws -> [T] {
    let rowsBySession = Dictionary(grouping: rows, by: sessionId)
    let sessions = try AppMetrics.getSessions(ids: Array(rowsBySession.keys))
    return sessions.compactMap { session in
      guard let sessionRows = rowsBySession[session.id] else {
        return nil
      }
      return transform(session, sessionRows)
    }
  }

  /// Emits one `OTResourceSpans` per session, mirroring how metrics and logs attach their
  /// session's resource metadata. Spans whose session row no longer exists are skipped — their
  /// rows are about to be deleted by the caller anyway.
  private static func buildResourceSpans(forSpans spans: [SpanRow]) throws -> [OTResourceSpans] {
    return try buildPerSession(spans, sessionId: \.sessionId) { session, sessionSpans in
      let event = Event.from(session: session, metrics: [], logs: [])
      return event.toOTResourceSpans(easClientId, spans: sessionSpans.map { $0.toOTSpan() })
    }
  }

  /// Emits one `Event` per session in the same shape Android dispatches: each event carries the
  /// session's metadata and only the metrics that belong to it.
  private static func buildEvents(forMetrics metrics: [MetricRow]) throws -> [Event] {
    return try buildPerSession(metrics, sessionId: \.sessionId) { session, sessionMetrics in
      return Event.from(session: session, metrics: sessionMetrics, logs: [])
    }
  }

  private static func buildEvents(forLogs logs: [LogRow]) throws -> [Event] {
    return try buildPerSession(logs, sessionId: \.sessionId) { session, sessionLogs in
      return Event.from(session: session, metrics: [], logs: sessionLogs)
    }
  }

  internal nonisolated static func setEndpointUrl(_ urlString: String?, projectId: String) {
    let defaultUrl = "https://o.expo.dev"
    let urlString = urlString ?? defaultUrl

    guard let url = URL(string: urlString) else {
      observeLogger.warn("[EAS Observe] Unable to set the endpoint url with string: \(urlString)")
      return
    }
    AppMetricsActor.isolated {
      self.metricsEndpointUrl = url.appendingPathComponent("\(projectId)/v1/metrics")
      self.logsEndpointUrl = url.appendingPathComponent("\(projectId)/v1/logs")
      self.tracesEndpointUrl = url.appendingPathComponent("\(projectId)/v1/traces")
    }
  }

  // Static function extracted for testability
  internal nonisolated static func shouldDispatch(
    config: PersistedConfig?,
    isDev: Bool,
    isInSample: Bool
  ) -> Bool {
    let dispatchingEnabled = config?.dispatchingEnabled ?? true
    let dispatchInDebug = config?.dispatchInDebug ?? false
    return dispatchingEnabled && isInSample && (!isDev || dispatchInDebug)
  }

  private static func shouldDispatch() -> Bool {
    let isJsDev = ObserveUserDefaults.bundleDefaults?.isJsDev ?? false
    let isDev = EXAppDefines.APP_DEBUG || isJsDev
    return Self.shouldDispatch(
      config: ObserveUserDefaults.config,
      isDev: isDev,
      isInSample: isInSample()
    )
  }

  private static func isInSample() -> Bool {
    guard let rate = ObserveUserDefaults.config?.sampleRate else {
      return true
    }
    let clamped = min(max(rate, 0.0), 1.0)
    return EASClientID.deterministicUniformValue(EASClientID.uuid()) < clamped
  }
}
