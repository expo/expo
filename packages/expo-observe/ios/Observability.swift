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

  /**
   Returns entries from AppMetrics storage whose id is newer than the supplied
   cursor.

   The first (current) entry may have a lower id than the cursor when storage
   was wiped, empty, or failed to decode — ids restart from 0 in that case.
   We return all entries so the cursor can be repaired on the next dispatch.
   */
  private static func entriesNewerThan(cursor: Int) -> [MetricsStorage.Entry] {
    let entries = AppMetrics.storage.getAllEntries()
    if let firstEntry = entries.first, firstEntry.id < cursor {
      return entries
    }
    return entries.filter { $0.id > cursor }
  }

  /**
   Entries whose metrics have not been dispatched yet.
   */
  internal static func getEntriesToDispatch() -> [MetricsStorage.Entry] {
    return entriesNewerThan(cursor: ObserveUserDefaults.lastDispatchedEntryId)
  }

  /**
   Entries whose logs have not been dispatched yet. Tracked independently from
   metrics so the two signals can advance in isolation.
   */
  internal static func getLogEntriesToDispatch() -> [MetricsStorage.Entry] {
    return entriesNewerThan(cursor: ObserveUserDefaults.lastDispatchedLogEntryId)
  }

  internal static func dispatch() async {
    // Compute once and reuse for both signals — `shouldDispatch()` reads the
    // persisted config, the bundle defaults, and computes a sample-rate hash.
    // Both halves of dispatch want the same answer.
    let shouldDispatch = Self.shouldDispatch()

    // Snapshot every entry as an `Event` once. Both metrics and logs project
    // out of the same snapshot, so building it twice would duplicate the
    // `Event.create` work for sessions that have both signals pending.
    let allEntries = AppMetrics.storage.getAllEntries()
    let eventsByEntryId: [Int: Event] = Dictionary(
      uniqueKeysWithValues: allEntries.map { entry in
        (
          entry.id,
          Event.create(
            app: entry.app, device: entry.device, sessions: entry.sessions,
            environment: entry.environment
          )
        )
      }
    )

    await dispatchMetrics(eventsByEntryId: eventsByEntryId, shouldDispatch: shouldDispatch)
    await dispatchLogs(eventsByEntryId: eventsByEntryId, shouldDispatch: shouldDispatch)
  }

  private static func dispatchMetrics(
    eventsByEntryId: [Int: Event],
    shouldDispatch: Bool
  ) async {
    let entries = getEntriesToDispatch()

    guard !entries.isEmpty, let endpointUrl = metricsEndpointUrl else {
      // Nothing to dispatch
      observeLogger.debug("[EAS Observe] No new entries to dispatch")
      return
    }
    if !shouldDispatch {
      ObserveUserDefaults.lastDispatchedEntryId = entries.first?.id ?? -1
      return
    }
    do {
      let events = entries.compactMap { eventsByEntryId[$0.id] }

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

  private static func dispatchLogs(
    eventsByEntryId: [Int: Event],
    shouldDispatch: Bool
  ) async {
    // Logs are only sent in OpenTelemetry mode — there is no legacy logs endpoint.
    guard useOpenTelemetry else {
      return
    }

    let entries = getLogEntriesToDispatch()

    guard !entries.isEmpty, let endpointUrl = logsEndpointUrl else {
      observeLogger.debug("[EAS Observe] No new log entries to dispatch")
      return
    }
    if !shouldDispatch {
      ObserveUserDefaults.lastDispatchedLogEntryId = entries.first?.id ?? -1
      return
    }
    do {
      // Skip the request when there's nothing to send, but still advance the cursor so we
      // don't keep re-checking the same entries.
      let resourceLogs = entries.compactMap { entry -> OTResourceLogs? in
        guard let event = eventsByEntryId[entry.id], !event.logs.isEmpty else {
          return nil
        }
        return event.toOTResourceLogs(easClientId)
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
