import EASClient
import ExpoAppMetrics
import ExpoModulesCore

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var metricsEndpointUrl: URL? = nil
  private static var logsEndpointUrl: URL? = nil
  private static var projectId: String? = nil

  internal static func dispatch() async {
    // Compute once and reuse for both signals — `shouldDispatch()` reads the persisted config, the
    // bundle defaults, and computes a sample-rate hash. Both halves of dispatch want the same answer.
    let shouldDispatch = Self.shouldDispatch()

    await dispatchMetrics(shouldDispatch: shouldDispatch)
    await dispatchLogs(shouldDispatch: shouldDispatch)
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
    // Commit A1 wiring: the classifier already returns a 3-way result, but the cursor still
    // moves only on `.success`. `.retryable` and `.nonRetryable` are both treated as "retain",
    // matching the pre-classifier behavior. The `.nonRetryable` branch lands its drop semantics
    // (advance the cursor) in commit B1.
    switch result {
    case .success:
      ObserveUserDefaults.lastDispatchDate = Date.now
      ObserveUserDefaults.lastDispatchedMetricId = highestId
    case .retryable, .nonRetryable:
      break
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
    // Same pre-B1 behavior as `dispatchMetrics`: only `.success` advances the cursor.
    switch result {
    case .success:
      ObserveUserDefaults.lastDispatchedLogId = highestId
    case .retryable, .nonRetryable:
      break
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
