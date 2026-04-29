import EASClient
import ExpoAppMetrics

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var metricsEndpointUrl: URL? = nil
  private static var logsEndpointUrl: URL? = nil
  private static var projectId: String? = nil
  private static var useOpenTelemetry = false

  // Determined at compile time of the host app's binary.
  #if DEBUG
  private static let isDebugBuild: Bool = true
  #else
  private static let isDebugBuild: Bool = false
  #endif

  /**
   Returns entries from AppMetrics storage whose metrics have not been dispatched yet.
   */
  internal static func getEntriesToDispatch() -> [MetricsStorage.Entry] {
    let entries = AppMetrics.storage.getAllEntries()
    let lastDispatchedEntryId = ObserveUserDefaults.lastDispatchedEntryId

    // The first (current) entry may have lower id than the last dispatched entry when
    // the storage was wiped out, empty or just failed to decode.
    // In this case ids start counting from 0 again and `lastDispatchedEntryId`
    // needs to be fixed on the next dispatch.
    if let firstEntry = entries.first, firstEntry.id < lastDispatchedEntryId {
      return entries
    }

    return entries.filter { entry in
      return entry.id > lastDispatchedEntryId
    }
  }

  /**
   Returns entries from AppMetrics storage whose logs have not been dispatched yet.
   Tracked independently from metrics so the two signals can advance in isolation.
   */
  internal static func getLogEntriesToDispatch() -> [MetricsStorage.Entry] {
    let entries = AppMetrics.storage.getAllEntries()
    let lastDispatchedLogEntryId = ObserveUserDefaults.lastDispatchedLogEntryId

    if let firstEntry = entries.first, firstEntry.id < lastDispatchedLogEntryId {
      return entries
    }

    return entries.filter { entry in
      return entry.id > lastDispatchedLogEntryId
    }
  }

  internal static func dispatch() async {
    await dispatchMetrics()
    await dispatchLogs()
  }

  private static func dispatchMetrics() async {
    let entries = getEntriesToDispatch()

    guard !entries.isEmpty, let endpointUrl = metricsEndpointUrl else {
      // Nothing to dispatch
      observeLogger.debug("[EAS Observe] No new entries to dispatch")
      return
    }
    if !shouldDispatch() {
      ObserveUserDefaults.lastDispatchedEntryId = entries.first?.id ?? -1
      return
    }
    do {
      let events = entries.map { entry in
        return Event.create(
          app: entry.app, device: entry.device, sessions: entry.sessions,
          environment: entry.environment)
      }

      if events.isEmpty {
        ObserveUserDefaults.lastDispatchedEntryId = entries.first?.id ?? -1
        return
      }

      let body: any Encodable
      if useOpenTelemetry {
        body = OTRequestBody(resourceMetrics: events.map { $0.toOTEvent(easClientId)})
      } else {
        body = RequestBody(easClientId: easClientId, events: events)
      }

      let success = try await sendRequest(to: endpointUrl, body: body)
      if success {
        ObserveUserDefaults.lastDispatchDate = Date.now
        ObserveUserDefaults.lastDispatchedEntryId = entries.first?.id ?? -1
      }
    } catch {
      observeLogger.warn("[EAS Observe] Dispatching the metrics has thrown an error: \(error)")
    }
  }

  private static func dispatchLogs() async {
    // Logs are only sent in OpenTelemetry mode — there is no legacy logs endpoint.
    guard useOpenTelemetry else {
      return
    }

    let entries = getLogEntriesToDispatch()

    guard !entries.isEmpty, let endpointUrl = logsEndpointUrl else {
      observeLogger.debug("[EAS Observe] No new log entries to dispatch")
      return
    }
    if !shouldDispatch() {
      ObserveUserDefaults.lastDispatchedLogEntryId = entries.first?.id ?? -1
      return
    }
    do {
      let events = entries.map { entry in
        return Event.create(
          app: entry.app, device: entry.device, sessions: entry.sessions,
          environment: entry.environment)
      }

      // Skip the request when there's nothing to send, but still advance the cursor so we
      // don't keep re-checking the same entries.
      let resourceLogs = events.compactMap { event -> OTResourceLogs? in
        return event.logs.isEmpty ? nil : event.toOTResourceLogs(easClientId)
      }
      if resourceLogs.isEmpty {
        ObserveUserDefaults.lastDispatchedLogEntryId = entries.first?.id ?? -1
        return
      }

      let body = OTLogsRequestBody(resourceLogs: resourceLogs)
      let success = try await sendRequest(to: endpointUrl, body: body)
      if success {
        ObserveUserDefaults.lastDispatchedLogEntryId = entries.first?.id ?? -1
      }
    } catch {
      observeLogger.warn("[EAS Observe] Dispatching the logs has thrown an error: \(error)")
    }
  }

  private static func sendRequest(to endpointUrl: URL, body: any Encodable) async throws -> Bool {
    var request = URLRequest(url: endpointUrl)
    request.httpMethod = "POST"
    request.allHTTPHeaderFields = ["Content-Type": "application/json"]
    request.httpBody = try body.toJSONData([])

    observeLogger.debug("[EAS Observe] Sending the request to \(endpointUrl) with body:")
    // Use `print` so the JSON can be copied without including the log level emojis.
    print(try body.toJSONString(.prettyPrinted))

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

  private static func shouldDispatch() -> Bool {
    let config = ObserveUserDefaults.config
    let dispatchingEnabled = config?.dispatchingEnabled ?? true
    let dispatchInDebug = config?.dispatchInDebug ?? false
    return dispatchingEnabled && isInSample() && (!isDebugBuild || dispatchInDebug)
  }

  private static func isInSample() -> Bool {
    guard let rate = ObserveUserDefaults.config?.sampleRate else {
      return true
    }
    let clamped = min(max(rate, 0.0), 1.0)
    return EASClientID.deterministicUniformValue(EASClientID.uuid()) < clamped
  }
}
