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

  /// How many rows one dispatch request carries at most. Dispatch keeps fetching and sending
  /// chunks of this size until the table is drained or a batch fails.
  private static let dispatchChunkSize = 200

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
    guard let endpointUrl = metricsEndpointUrl else {
      return
    }
    if retryGateBlocks(metricsRetryGate, signal: "metrics") {
      return
    }

    repairMetricCursorIfStale()

    var cursor = ObserveUserDefaults.lastDispatchedMetricId
    if !shouldDispatch {
      do {
        if let highestId = try AppMetrics.getMaxMetricId() {
          ObserveUserDefaults.lastDispatchedMetricId = highestId
        }
      } catch {
        observeLogger.warn("[EAS Observe] Failed to read pending metrics: \(error.localizedDescription)")
      }
      return
    }

    dispatchLoop: while !Task.isCancelled {
      let fetchedMetrics: [MetricRow]
      do {
        fetchedMetrics = try AppMetrics.getMetrics(afterId: cursor, limit: dispatchChunkSize)
      } catch {
        observeLogger.warn("[EAS Observe] Failed to read pending metrics: \(error.localizedDescription)")
        return
      }
      guard !fetchedMetrics.isEmpty else {
        observeLogger.debug("[EAS Observe] No new metrics to dispatch")
        return
      }

      var metrics = fetchedMetrics
      while !Task.isCancelled {
        guard let lastRow = metrics.last else {
          return
        }
        // A missing id must never rewind the cursor, so fall back to the current one.
        let highestId = lastRow.id ?? cursor

        let events: [Event]
        do {
          events = try buildEvents(forMetrics: metrics)
        } catch {
          observeLogger.warn("[EAS Observe] Failed to assemble metric events: \(error.localizedDescription)")
          return
        }
        guard !events.isEmpty else {
          // Stop when the batch cannot advance the cursor — continuing would refetch and
          // re-send the same rows forever.
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          ObserveUserDefaults.lastDispatchedMetricId = cursor
          continue dispatchLoop
        }

        let body = OTRequestBody(resourceMetrics: events.map { $0.toOTEvent(easClientId) })
        let result = await DispatchUtils.sendRequest(to: endpointUrl, body: body)
        applyRetryOutcome(result, to: &metricsRetryGate)

        switch result {
        case .success:
          ObserveUserDefaults.lastDispatchDate = Date.now
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          ObserveUserDefaults.lastDispatchedMetricId = cursor
          continue dispatchLoop
        case .partialSuccess(let partial):
          ObserveUserDefaults.lastDispatchDate = Date.now
          observeLogger.warn(
            "[EAS Observe] Partial success on batch of \(metrics.count) metric row(s) past "
              + "id \(highestId): server rejected \(partial.rejectedCount) "
              + "(\(partial.errorMessage ?? "no error message"))"
          )
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          ObserveUserDefaults.lastDispatchedMetricId = cursor
          continue dispatchLoop
        case .retryableFailure:
          return
        case .nonRetryableFailure(let reason):
          observeLogger.warn(
            "[EAS Observe] Dropping batch of \(metrics.count) metric row(s) past id "
              + "\(highestId): \(reason)"
          )
          ObserveUserDefaults.lastDispatchedMetricId = highestId
          return
        case .payloadTooLarge:
          guard metrics.count > 1 else {
            observeLogger.warn(
              "[EAS Observe] Dropping metric row id \(highestId) because it exceeds the server payload limit"
            )
            ObserveUserDefaults.lastDispatchedMetricId = highestId
            return
          }
          // Unlike Android's re-fetch, slicing can re-send rows deleted during this loop, and event
          // payloads are rebuilt from the session snapshot available on each attempt.
          metrics = Array(metrics.prefix(max(1, metrics.count / 2)))
        }
      }
    }
  }

  private static func dispatchLogs(shouldDispatch: Bool) async {
    guard let endpointUrl = logsEndpointUrl else {
      return
    }
    if retryGateBlocks(logsRetryGate, signal: "logs") {
      return
    }

    repairLogCursorIfStale()

    var cursor = ObserveUserDefaults.lastDispatchedLogId
    if !shouldDispatch {
      do {
        if let highestId = try AppMetrics.getMaxLogId() {
          ObserveUserDefaults.lastDispatchedLogId = highestId
        }
      } catch {
        observeLogger.warn("[EAS Observe] Failed to read pending logs: \(error.localizedDescription)")
      }
      return
    }

    dispatchLoop: while !Task.isCancelled {
      let fetchedLogs: [LogRow]
      do {
        fetchedLogs = try AppMetrics.getLogs(afterId: cursor, limit: dispatchChunkSize)
      } catch {
        observeLogger.warn("[EAS Observe] Failed to read pending logs: \(error.localizedDescription)")
        return
      }
      guard !fetchedLogs.isEmpty else {
        observeLogger.debug("[EAS Observe] No new logs to dispatch")
        return
      }

      var logs = fetchedLogs
      while !Task.isCancelled {
        guard let lastRow = logs.last else {
          return
        }
        // A missing id must never rewind the cursor, so fall back to the current one.
        let highestId = lastRow.id ?? cursor

        let events: [Event]
        do {
          events = try buildEvents(forLogs: logs)
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
        guard !resourceLogs.isEmpty else {
          // Stop when the batch cannot advance the cursor — continuing would refetch and
          // re-send the same rows forever.
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          ObserveUserDefaults.lastDispatchedLogId = cursor
          continue dispatchLoop
        }

        let body = OTLogsRequestBody(resourceLogs: resourceLogs)
        let result = await DispatchUtils.sendRequest(to: endpointUrl, body: body)
        applyRetryOutcome(result, to: &logsRetryGate)

        switch result {
        case .success:
          ObserveUserDefaults.lastDispatchDate = Date.now
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          ObserveUserDefaults.lastDispatchedLogId = cursor
          continue dispatchLoop
        case .partialSuccess(let partial):
          ObserveUserDefaults.lastDispatchDate = Date.now
          observeLogger.warn(
            "[EAS Observe] Partial success on batch of \(logs.count) log row(s) past "
              + "id \(highestId): server rejected \(partial.rejectedCount) "
              + "(\(partial.errorMessage ?? "no error message"))"
          )
          guard highestId > cursor else {
            return
          }
          cursor = highestId
          ObserveUserDefaults.lastDispatchedLogId = cursor
          continue dispatchLoop
        case .retryableFailure:
          ObserveUserDefaults.lastDispatchDate = Date.now
          return
        case .nonRetryableFailure(let reason):
          observeLogger.warn(
            "[EAS Observe] Dropping batch of \(logs.count) log row(s) past id "
              + "\(highestId): \(reason)"
          )
          ObserveUserDefaults.lastDispatchedLogId = highestId
          return
        case .payloadTooLarge:
          guard logs.count > 1 else {
            observeLogger.warn(
              "[EAS Observe] Dropping log row id \(highestId) because it exceeds the server payload limit"
            )
            ObserveUserDefaults.lastDispatchedLogId = highestId
            return
          }
          // Unlike Android's re-fetch, slicing can re-send rows deleted during this loop, and event
          // payloads are rebuilt from the session snapshot available on each attempt.
          logs = Array(logs.prefix(max(1, logs.count / 2)))
        }
      }
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
