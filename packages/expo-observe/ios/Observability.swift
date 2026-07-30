import EASClient
import ExpoAppMetrics
import ExpoModulesCore

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var metricsEndpointUrl: URL? = nil
  private static var logsEndpointUrl: URL? = nil
  private static var projectId: String? = nil

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

  internal static func dispatch() async {
    // Per-signal gates are checked inside `dispatchMetrics` / `dispatchLogs` rather than
    // here, so a backoff on one endpoint doesn't suppress the other's traffic.
    let shouldDispatch = Self.shouldDispatch()

    await dispatchMetrics(shouldDispatch: shouldDispatch)
    await dispatchLogs(shouldDispatch: shouldDispatch)
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

  /// Groups `metrics` by `sessionId`, hydrates the matching session rows, and emits one `Event` per
  /// session in the same shape Android dispatches: each event carries the session's metadata and only
  /// the metrics that belong to it.
  private static func buildEvents(forMetrics metrics: [MetricRow]) throws -> [Event] {
    let metricsBySession = Dictionary(grouping: metrics, by: \.sessionId)
    let sessionIds = Array(metricsBySession.keys)
    let sessions = try AppMetrics.getSessions(ids: sessionIds)
    return sessions.compactMap { session in
      guard let sessionMetrics = metricsBySession[session.id] else {
        return nil
      }
      return Event.from(session: session, metrics: sessionMetrics, logs: [])
    }
  }

  private static func buildEvents(forLogs logs: [LogRow]) throws -> [Event] {
    let logsBySession = Dictionary(grouping: logs, by: \.sessionId)
    let sessionIds = Array(logsBySession.keys)
    let sessions = try AppMetrics.getSessions(ids: sessionIds)
    return sessions.compactMap { session in
      guard let sessionLogs = logsBySession[session.id] else {
        return nil
      }
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
    }
  }

  // Static function extracted for testability
  internal nonisolated static func shouldDispatch(
    config: PersistedConfig?, isDev: Bool, isInSample: Bool
  ) -> Bool {
    let dispatchingEnabled = config?.dispatchingEnabled ?? true
    let dispatchInDebug = config?.dispatchInDebug ?? false
    return dispatchingEnabled && isInSample && (!isDev || dispatchInDebug)
  }

  private static func shouldDispatch() -> Bool {
    let isJsDev = ObserveUserDefaults.bundleDefaults?.isJsDev ?? false
    let isDev = EXAppDefines.APP_DEBUG || isJsDev
    return Self.shouldDispatch(
      config: ObserveUserDefaults.config, isDev: isDev, isInSample: isInSample()
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
