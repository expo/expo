import EASClient
import ExpoAppMetrics
import ExpoModulesCore

@AppMetricsActor
internal struct ObservabilityManager {
  private static let easClientId = EASClientID.uuid().uuidString
  private static var endpointUrl: URL? = nil
  private static var projectId: String? = nil
  private static var useOpenTelemetry = false


  /**
   Returns entries from AppMetrics storage that have not been dispatched yet.
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

  internal static func dispatch() async {
    let entries = getEntriesToDispatch()

    guard !entries.isEmpty, let endpointUrl else {
      // Nothing to dispatch
      observeLogger.debug("[EAS Observe] No new entries to dispatch")
      return
    }
    do {
      if !Self.shouldDispatch() {
        ObserveUserDefaults.lastDispatchedEntryId = entries.first?.id ?? -1
        return
      }

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
      var request = URLRequest(url: endpointUrl)
      request.httpMethod = "POST"
      request.allHTTPHeaderFields = ["Content-Type": "application/json"]
      request.httpBody = try body.toJSONData([])

      observeLogger.debug("[EAS Observe] Sending the request to \(endpointUrl) with body:")
      // Use `print` so the JSON can be copied without including the log level emojis.
      print(try body.toJSONString(.prettyPrinted))

      let (responseData, urlResponse) = try await URLSession.shared.data(for: request)

      guard let urlResponse = urlResponse as? HTTPURLResponse else {
        return
      }
      guard (200...299).contains(urlResponse.statusCode) else {
        observeLogger.warn("[EAS Observe] Server responded with \(urlResponse.statusCode) status code and data: \(String(data: responseData, encoding: .utf8) ?? "<unreadable>")")
        return
      }
      observeLogger.debug("[EAS Observe] Server responded successfully with \(urlResponse.statusCode) status code and data: \(String(data: responseData, encoding: .utf8) ?? "<unreadable>")")

      ObserveUserDefaults.lastDispatchDate = Date.now
      ObserveUserDefaults.lastDispatchedEntryId = entries.first?.id ?? -1
    } catch {
      observeLogger.warn("[EAS Observe] Dispatching the events has thrown an error: \(error)")
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

  internal nonisolated static func setEndpointUrl(_ urlString: String?, projectId: String) {
    let defaultUrl = "https://o.expo.dev"
    let urlString = urlString ?? defaultUrl

    guard let url = URL(string: urlString) else {
      observeLogger.warn("[EAS Observe] Unable to set the endpoint url with string: \(urlString)")
      return
    }
    AppMetricsActor.isolated {
      self.endpointUrl = url.appendingPathComponent(useOpenTelemetry ?  "\(projectId)/v1/metrics" : projectId)
    }
  }

  internal nonisolated static func setUseOpenTelemetry(_ enabled: Bool?) {
    let enabled = enabled ?? true
    AppMetricsActor.isolated {
      self.useOpenTelemetry = enabled
    }
  }

  private static func isInSample() -> Bool {
    guard let rate = ObserveUserDefaults.config?.sampleRate else {
      return true
    }
    let clamped = min(max(rate, 0.0), 1.0)
    return EASClientID.deterministicUniformValue(EASClientID.uuid()) < clamped
  }
}
