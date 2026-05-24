import EASClient
import ExpoAppMetrics
import ExpoModulesCore

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var metricsEndpointUrl: URL? = nil
  private static var logsEndpointUrl: URL? = nil
  private static var projectId: String? = nil
  private static var useOpenTelemetry = false

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
    do {
      let body: any Encodable
      if useOpenTelemetry {
        body = OTRequestBody(resourceMetrics: events.map { $0.toOTEvent(easClientId) })
      } else {
        body = RequestBody(easClientId: easClientId, events: events)
      }
      let success = try await sendRequest(to: endpointUrl, body: body)
      if success {
        ObserveUserDefaults.lastDispatchDate = Date.now
        ObserveUserDefaults.lastDispatchedMetricId = highestId
      }
    } catch {
      observeLogger.warn("[EAS Observe] Dispatching the metrics has thrown an error: \(error)")
    }
  }

  private static func dispatchLogs(shouldDispatch: Bool) async {
    // Logs are only sent in OpenTelemetry mode — there is no legacy logs endpoint.
    guard useOpenTelemetry else {
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
    do {
      let body = OTLogsRequestBody(resourceLogs: resourceLogs)
      let success = try await sendRequest(to: endpointUrl, body: body)
      if success {
        ObserveUserDefaults.lastDispatchedLogId = highestId
      }
    } catch {
      observeLogger.warn("[EAS Observe] Dispatching the logs has thrown an error: \(error)")
    }
  }

  /**
   Groups `metrics` by `sessionId`, hydrates the matching session rows, and emits one `Event` per
   session in the same shape Android dispatches: each event carries the session's metadata and only
   the metrics that belong to it.
   */
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

  private static func sendRequest(to endpointUrl: URL, body: any Encodable) async throws -> Bool {
    var request = URLRequest(url: endpointUrl)
    request.httpMethod = "POST"
    request.allHTTPHeaderFields = ["Content-Type": "application/json"]
    request.httpBody = try body.toJSONData([])

    #if DEBUG
    observeLogger.debug("[EAS Observe] Sending the request to \(endpointUrl) with body:")
    // Use `print` so the JSON can be copied without including the log level emojis. Wrapped in
    // `#if DEBUG` so release builds don't pay for a second pretty-printed encode of the payload.
    print(try body.toJSONString(.prettyPrinted))
    #endif

    let (responseData, urlResponse) = try await URLSession.shared.data(for: request)

    guard let urlResponse = urlResponse as? HTTPURLResponse else {
      return false
    }
    guard (200...299).contains(urlResponse.statusCode) else {
      observeLogger.warn("[EAS Observe] Server responded with \(urlResponse.statusCode) status code and data: \(String(data: responseData, encoding: .utf8) ?? "<unreadable>")")
      return false
    }
    observeLogger.debug("[EAS Observe] Server responded successfully with \(urlResponse.statusCode) status code and data: \(String(data: responseData, encoding: .utf8) ?? "<unreadable>")")
    return true
  }

  internal nonisolated static func setEndpointUrl(_ urlString: String?, projectId: String) {
    let defaultUrl = "https://o.expo.dev"
    let urlString = urlString ?? defaultUrl

    guard let url = URL(string: urlString) else {
      observeLogger.warn("[EAS Observe] Unable to set the endpoint url with string: \(urlString)")
      return
    }
    AppMetricsActor.isolated {
      if useOpenTelemetry {
        self.metricsEndpointUrl = url.appendingPathComponent("\(projectId)/v1/metrics")
        self.logsEndpointUrl = url.appendingPathComponent("\(projectId)/v1/logs")
      } else {
        self.metricsEndpointUrl = url.appendingPathComponent(projectId)
        self.logsEndpointUrl = nil
      }
    }
  }

  internal nonisolated static func setUseOpenTelemetry(_ enabled: Bool?) {
    let enabled = enabled ?? true
    AppMetricsActor.isolated {
      self.useOpenTelemetry = enabled
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

