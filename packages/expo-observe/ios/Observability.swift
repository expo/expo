import EASClient
import ExpoAppMetrics
import ExpoModulesCore

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var metricsEndpointUrl: URL? = nil
  private static var logsEndpointUrl: URL? = nil
  private static var projectId: String? = nil

  /// In-memory retry-gate state. Reset implicitly when the process restarts — a relaunch
  /// usually means enough time passed that the transient cause has cleared anyway, and
  /// persisting the gate would mean an extra UserDefaults write on every retryable response.
  private static var retryGateState: DispatchUtils.RetryGateState = .initial

  internal static func dispatch() async {
    // Honor the retry gate first: if a previous round told us to back off (server-supplied
    // `Retry-After` or computed exponential backoff after a transient failure), short-circuit
    // until the deadline elapses. Skips both signals together so we don't hammer the same
    // server endpoint with logs traffic while it's asking us to slow down metrics.
    if let until = retryGateState.dispatchAfterDate, until > Date() {
      observeLogger.debug(
        "[EAS Observe] Dispatch suppressed by retry gate until \(until)"
      )
      return
    }

    // Compute once and reuse for both signals — `shouldDispatch()` reads the persisted config, the
    // bundle defaults, and computes a sample-rate hash. Both halves of dispatch want the same answer.
    let shouldDispatch = Self.shouldDispatch()

    await dispatchMetrics(shouldDispatch: shouldDispatch)
    await dispatchLogs(shouldDispatch: shouldDispatch)
  }

  /// Applies a per-signal dispatch outcome to the shared retry-gate state. Mirrors the pure
  /// `DispatchUtils.nextRetryGateState(...)` but reads/writes the manager's static field so the
  /// call sites stay concise. Called from both `dispatchMetrics` and `dispatchLogs` after each
  /// `DispatchUtils.sendRequest(...)` call so the gate reflects the latest signal's response.
  private static func applyRetryOutcome(_ result: DispatchResult) {
    retryGateState = DispatchUtils.nextRetryGateState(
      result: result,
      currentState: retryGateState,
      now: Date(),
      backoff: { DispatchUtils.computeBackoffDelay(attempt: $0) }
    )
  }

  private static func dispatchMetrics(shouldDispatch: Bool) async {
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
    applyRetryOutcome(result)
    ObserveUserDefaults.lastDispatchedMetricId = DispatchUtils.nextCursor(
      for: result,
      currentCursor: cursor,
      highestId: highestId
    )
    switch result {
    case .success:
      ObserveUserDefaults.lastDispatchDate = Date.now
    case .retryable:
      break
    case .nonRetryable(let reason):
      observeLogger.warn(
        "[EAS Observe] Dropping batch of \(events.count) metric event(s) past id "
          + "\(highestId): \(reason)"
      )
    }
  }

  private static func dispatchLogs(shouldDispatch: Bool) async {
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
    applyRetryOutcome(result)
    ObserveUserDefaults.lastDispatchedLogId = DispatchUtils.nextCursor(
      for: result,
      currentCursor: cursor,
      highestId: highestId
    )
    switch result {
    case .success, .retryable:
      break
    case .nonRetryable(let reason):
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
