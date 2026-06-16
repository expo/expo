import EASClient
import ExpoAppMetrics
import ExpoModulesCore

/// State carried across re-arms of the deferred-dispatch timer for a single deferral window.
/// Lives at file scope so the pure helper `computeNextDeferredArm` can take it as an argument
/// without coupling to `ObservabilityManager`'s actor isolation.
internal struct DeferredArmState: Equatable {
  let fireTime: Date
  let originalArmTime: Date
}

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

  /// Interval (in seconds) between periodic dispatches while the process is alive. `nil` (the
  /// default) means the loop is a no-op; set via `setDispatchIntervalSeconds(_:)` from
  /// `Observe.configure({ scheduledDispatchInterval })`. The loop reads this on each wake, so a
  /// `configure(...)` change takes effect on the next pass.
  private static var dispatchIntervalSeconds: TimeInterval?
  /// Default deferred-dispatch delay when no explicit value is configured (30 minutes).
  private static let defaultDeferredDispatchDelaySeconds: TimeInterval = 1800

  /// Polling cadence (in seconds) for checking the metrics DB for new rows. `nil` keeps the loop
  /// idle. Updated via `setPollingIntervalSeconds(_:)` from
  /// `Observe.configure({ scheduledDispatchPollingInterval })`. The loop reads this on each wake,
  /// so a `configure(...)` change takes effect on the next pass.
  private static var pollingIntervalSeconds: TimeInterval?

  /// Delay (in seconds) between detecting new rows and the deferred dispatch firing. `nil` falls
  /// back to `defaultDeferredDispatchDelaySeconds`. Updated via
  /// `setDeferredDispatchDelaySeconds(_:)` from `Observe.configure({ scheduledDispatchDelay })`.
  private static var deferredDispatchDelaySeconds: TimeInterval?

  private static var pollingLoopStarted = false

  /// The currently-armed deferred dispatch, if any. Set when polling detects new rows; replaced
  /// (the old task is cancelled) when polling fires again with new rows; cancelled when any other
  /// `dispatch()` runs first.
  private static var deferredDispatchTask: Task<Void, Never>?

  /// When the currently-armed deferred dispatch is scheduled to fire (wall clock). `nil` when no
  /// dispatch is armed. Re-arms read this to compute the next fire time as `existing + delay/2`.
  private static var deferredDispatchFireTime: Date?

  /// When the *first* arm in the current deferral window happened. Cleared after dispatch (or
  /// cancellation). Combined with `deferredDispatchDelaySeconds` to enforce the hard cap on how
  /// far re-arms can push out — at most `2 × delay` past this point.
  private static var deferredDispatchOriginalArmTime: Date?

  /// Sets the polling interval for the metrics-DB polling loop. Passing a positive number of
  /// seconds starts the loop on its first call. Subsequent calls update the interval in place; the
  /// next wake uses the new value. Passing `nil` (or `0`) leaves the loop idle.
  internal nonisolated static func setPollingIntervalSeconds(_ intervalSeconds: TimeInterval?) {
    AppMetricsActor.isolated {
      self.pollingIntervalSeconds = intervalSeconds
      if !pollingLoopStarted, let intervalSeconds, intervalSeconds > 0 {
        pollingLoopStarted = true
        startPollingLoop()
      }
    }
  }

  /// Sets the delay between detecting new rows and the deferred dispatch firing.
  internal nonisolated static func setDeferredDispatchDelaySeconds(_ delaySeconds: TimeInterval?) {
    AppMetricsActor.isolated {
      self.deferredDispatchDelaySeconds = delaySeconds
    }
  }

  /// Runs the repeating poll on `AppMetricsActor`. The poll checks the metrics and logs DB cursors
  /// for new rows; when either has new rows, it (re)arms a one-shot deferred dispatch — bursty
  /// writes batch into a single dispatch at the end of the window. The poll itself does not send
  /// anything. The loop reads `pollingIntervalSeconds` at each wake — if cleared, it idles in a
  /// 1-minute heartbeat until a positive value is restored.
  private static func startPollingLoop() {
    AppMetricsActor.isolated {
      while !Task.isCancelled {
        let interval = pollingIntervalSeconds.map { max($0, 1) } ?? 60
        try? await Task.sleep(nanoseconds: UInt64(interval) * 1_000_000_000)
        guard let configured = pollingIntervalSeconds, configured > 0 else {
          continue
        }
        pollOnceAndMaybeArmDispatch()
      }
    }
  }

  /// One pass of the polling loop. Compares the max metric/log ids against the persisted dispatch
  /// cursors — if either has new rows, (re)arms the deferred dispatch timer. The decision logic
  /// is delegated to `shouldArmDeferred` so it can be unit-tested without real storage; reader
  /// closures wrap `AppMetrics.getMaxMetricId()` / `getMaxLogId()` and log on failure.
  private static func pollOnceAndMaybeArmDispatch() {
    if shouldArmDeferred(
      metricCursor: ObserveUserDefaults.lastDispatchedMetricId,
      logCursor: ObserveUserDefaults.lastDispatchedLogId,
      readMaxMetricId: {
        do {
          return try AppMetrics.getMaxMetricId()
        } catch {
          observeLogger.warn(
            "[EAS Observe] Polling failed to read max metric id: \(error.localizedDescription)"
          )
          throw error
        }
      },
      readMaxLogId: {
        do {
          return try AppMetrics.getMaxLogId()
        } catch {
          observeLogger.warn(
            "[EAS Observe] Polling failed to read max log id: \(error.localizedDescription)"
          )
          throw error
        }
      }
    ) {
      armDeferredDispatch()
    }
  }

  /// Arms — or re-arms — the deferred dispatch timer.
  ///
  /// - First arm in a deferral window: schedule for `now + delay`.
  /// - Subsequent re-arms (timer already pending): push the existing fire time out by `delay / 2`,
  ///   capped so re-arms can never push beyond `original arm time + 2 × delay`. The cap bounds
  ///   the worst-case starvation in a chatty app: once at the cap, further polls don't extend the
  ///   timer, and it fires on schedule.
  private static func armDeferredDispatch() {
    let delay = max((deferredDispatchDelaySeconds ?? defaultDeferredDispatchDelaySeconds), 0)
    let now = Date()

    let existing: DeferredArmState? = {
      guard let fire = deferredDispatchFireTime, let original = deferredDispatchOriginalArmTime
      else { return nil }
      return DeferredArmState(fireTime: fire, originalArmTime: original)
    }()
    let next = computeNextDeferredArm(now: now, delay: delay, existing: existing)
    if existing != nil {
      observeLogger.debug(
        "[EAS Observe] Re-arming deferred dispatch: pushed to \(next.fireTime)"
      )
    } else {
      observeLogger.debug("[EAS Observe] Arming deferred dispatch for \(next.fireTime)")
    }

    deferredDispatchTask?.cancel()
    deferredDispatchFireTime = next.fireTime
    deferredDispatchOriginalArmTime = next.originalArmTime
    let sleepInterval = max(next.fireTime.timeIntervalSince(now), 0)
    let nanoseconds = UInt64(sleepInterval.rounded()) * 1_000_000_000
    deferredDispatchTask = Task { @AppMetricsActor in
      try? await Task.sleep(nanoseconds: nanoseconds)
      if Task.isCancelled { return }
      deferredDispatchTask = nil
      deferredDispatchFireTime = nil
      deferredDispatchOriginalArmTime = nil
      await dispatch(cancelDeferred: false)
    }
  }

  /// Pure helper that computes the next arm state for the deferred-dispatch timer. Extracted from
  /// `armDeferredDispatch` so the half-push and cap rules can be unit-tested without a real `Task`
  /// or wall clock.
  ///
  /// - First arm (no existing state, or existing fire time has already passed): schedule for
  ///   `now + delay`. `originalArmTime` is `now`.
  /// - Re-arm (existing fire time still in the future): push the existing fire time by `delay / 2`,
  ///   capped at `existing.originalArmTime + 2 × delay`. `originalArmTime` is preserved.
  internal nonisolated static func computeNextDeferredArm(
    now: Date,
    delay: TimeInterval,
    existing: DeferredArmState?
  ) -> DeferredArmState {
    if let existing, existing.fireTime > now {
      let pushed = existing.fireTime.addingTimeInterval(delay / 2)
      let cap = existing.originalArmTime.addingTimeInterval(2 * delay)
      return DeferredArmState(
        fireTime: min(pushed, cap),
        originalArmTime: existing.originalArmTime
      )
    }
    return DeferredArmState(fireTime: now.addingTimeInterval(delay), originalArmTime: now)
  }

  /// Pure helper that mirrors `pollOnceAndMaybeArmDispatch`'s decision logic without touching real
  /// storage. Returns `true` when either the metrics or logs DB has a max id strictly greater than
  /// the corresponding dispatch cursor — i.e. the caller should arm the deferred dispatch.
  ///
  /// Reader closures `throw` to model `AppMetrics.getMaxMetricId()` / `getMaxLogId()` failures —
  /// the real implementations log and treat the result as "no new rows", so this helper does the
  /// same here.
  internal nonisolated static func shouldArmDeferred(
    metricCursor: Int64,
    logCursor: Int64,
    readMaxMetricId: () throws -> Int64?,
    readMaxLogId: () throws -> Int64?
  ) -> Bool {
    let hasNewMetrics: Bool = {
      do {
        guard let maxId = try readMaxMetricId() else { return false }
        return maxId > metricCursor
      } catch {
        return false
      }
    }()
    let hasNewLogs: Bool = {
      do {
        guard let maxId = try readMaxLogId() else { return false }
        return maxId > logCursor
      } catch {
        return false
      }
    }()
    return hasNewMetrics || hasNewLogs
  }

  /// Cancels any armed deferred dispatch. Called from `dispatch(cancelDeferred:)` so any other
  /// dispatch path (lifecycle, manual) supersedes the deferred timer.
  private static func cancelDeferredDispatch() {
    deferredDispatchTask?.cancel()
    deferredDispatchTask = nil
    deferredDispatchFireTime = nil
    deferredDispatchOriginalArmTime = nil
  }

  internal static func dispatch() async {
    // Compute once and reuse for both signals — `shouldDispatch()` reads the persisted config, the
    // bundle defaults, and computes a sample-rate hash. Both halves of dispatch want the same answer.
    await dispatch(cancelDeferred: true)
  }

  /// `cancelDeferred` is `true` from every entry point except the deferred timer itself — the timer
  /// already nilled the task out before calling, so cancelling there would just no-op.
  private static func dispatch(cancelDeferred: Bool) async {
    if cancelDeferred {
      cancelDeferredDispatch()
    }
    // Compute once and reuse for both signals — `shouldDispatch()` reads the persisted config, the
    // bundle defaults, and computes a sample-rate hash. Both halves of dispatch want the same answer.
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
