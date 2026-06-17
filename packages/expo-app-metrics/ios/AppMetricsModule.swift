import EXUpdatesInterface
import ExpoModulesCore
import Foundation

internal let logger = Logger(logHandlers: [createOSLogHandler(category: Logger.EXPO_LOG_CATEGORY)])

public final class AppMetricsModule: Module, UpdatesStateChangeListener {
  var subscription: UpdatesStateChangeSubscription?

  public func definition() -> ModuleDefinition {
    Name("ExpoAppMetrics")

    OnCreate {
      AppMetricsActor.isolated {
        AppMetrics.mainSession.updatesMonitor.patchAppInfoIfNeeded()
      }
      if let updatesController = UpdatesControllerRegistry.sharedInstance.controller {
        subscription = updatesController.subscribeToUpdatesStateChanges(self)
      }
    }

    OnDestroy {
      subscription?.remove()
    }

    Function("markFirstRender") {
      AppMetrics.mainSession.appStartupMonitor.markFirstRender()
    }

    Function("markInteractive") { (attributes: MetricAttributes?) in
      AppMetrics.mainSession.appStartupMonitor.markInteractive(
        routeName: attributes?.routeName,
        params: attributes?.params ?? [:]
      )
    }

    // TODO(@ubax): move `logEvent` onto the Session shared object so logs are recorded via a
    // session handle (like `addMetric`), instead of writing to `mainSession` directly here.
    Function("logEvent") { (name: String, options: LogEventOptions?) in
      guard let validatedName = validateEventName(name) else {
        return
      }
      let validatedBody = validateEventBody(options?.body)
      let sanitized = sanitizeLogEventAttributes(options?.attributes)
      // Globals merge happens in `LogRow.from` so every persistence path picks them up.
      let record = LogRecord(
        name: validatedName,
        body: validatedBody,
        attributes: sanitized.attributes,
        droppedAttributesCount: sanitized.droppedCount,
        severity: options?.severity ?? .info
      )

      AppMetricsActor.isolated {
        AppMetrics.mainSession.receiveLog(record)
      }
    }

    Function("setGlobalAttributes") { (attributes: [String: Any]?) in
      GlobalAttributes.set(attributes)
    }

    AsyncFunction("getAppStartupTimesAsync") {
      return await AppMetrics.mainSession.appStartupMonitor.metrics
    }

    AsyncFunction("getMemoryUsageSnapshotAsync") {
      return try await AppMetricsActor.isolated {
        return MemoryUsageSnapshot.getCurrent()
      }
    }

    AsyncFunction("getFrameRateMetricsAsync") {
      return await AppMetrics.mainSession.frameMetricsRecorder.metrics
    }

    AsyncFunction("clearStoredEntries") {
      // no-op
    }

    // Debug-only: the inactive (ended) sessions
    AsyncFunction("getInactiveSessions") { () -> [StoredSession] in
      return try await AppMetricsActor.isolated {
        return try AppMetrics.database?
          .getInactiveSessionsWithChildren()
          .map { StoredSession(from: $0) } ?? []
      }.value
    }

    AsyncFunction("addCustomMetricToSession") { (jsMetric: JsMetric) in
      try await AppMetricsActor.isolated {
        let metric = jsMetric.toMetric()
        try AppMetrics.database?.insert(metric: MetricRow.from(metric: metric, sessionId: jsMetric.sessionId))
      }.value
    }

    // Synchronous and never nil: the main session is the process-lifetime singleton, always
    // available. It's a `SharedObject`, so returning the same instance hands JS the identical shared
    // object on every call (`getMainSession() === getMainSession()`).
    Function("getMainSession") { () -> Session in
      return AppMetrics.mainSession
    }

    // Returns the current foreground session, or `nil` when the app is not in the foreground.
    // Reads the actor-isolated `foregroundSession`, so it's async. The instance is the shared object
    // itself, so JS gets the same object while the session is current and a new one after it rotates.
    AsyncFunction("getForegroundSession") { () -> Session? in
      return try await AppMetricsActor.isolated { AppMetrics.foregroundSession }.value
    }

    Class("Session", Session.self) {
      Property("id") { $0.id }
      Property("type") { $0.type.rawValue }
      Property("startDate") { $0.startDate.ISO8601Format() }

      AsyncFunction("isActive") { (session: Session) -> Bool in
        return try await AppMetricsActor.isolated { session.isActive }.value
      }

      AsyncFunction("getEndDate") { (session: Session) -> String? in
        return try await AppMetricsActor.isolated { session.endDate?.ISO8601Format() }.value
      }

      AsyncFunction("getMetrics") { (session: Session) -> [Metric] in
        return try await AppMetricsActor.isolated { try session.getMetrics() }.value
      }

      AsyncFunction("getLogs") { (session: Session) -> [LogRecord] in
        return try await AppMetricsActor.isolated { try session.getLogs() }.value
      }

      AsyncFunction("addMetric") { (session: Session, input: SessionMetricInput) in
        try await AppMetricsActor.isolated { try session.addMetric(input) }.value
      }
    }

    // Records an unhandled JavaScript error captured by the JS-side `global.ErrorUtils` handler as a
    // log event. The JS layer owns capture (and chaining to the previous handler); native records it
    // through the same log pipeline as everything else, so it persists, attributes to the session,
    // and dispatches with no special-case storage.
    Function("reportError") { (report: ErrorReport) in
      AppMetricsActor.isolated {
        AppMetrics.mainSession.receiveLog(report.toLogRecord())
      }
    }

    Class(NetworkRequestObserver.self) {
      Constructor { (filter: NetworkRequestFilter?) in
        return NetworkRequestObserver(filter: filter)
      }

      Function("setFilter") { (observer: NetworkRequestObserver, filter: NetworkRequestFilter?) in
        observer.setFilter(filter)
      }
    }
  }

  public func updatesStateDidChange(_ event: [String: Any]) {
    if UpdatesStateEvent.fromDict(event)?.type ?? .restart == .downloadCompleteWithUpdate,
      let metric = AppMetrics.mainSession.updatesMonitor.downloadTimeMetric(subscription)
    {
      Task { @AppMetricsActor in
        AppMetrics.mainSession.updatesMonitor.reportMetric(metric)
      }
    }
  }
}

// Loads a session and its children from the database and wraps it as a `StoredSession`,
// returning `nil` when the database is unavailable or the session no longer exists.
@AppMetricsActor
private func storedSession(id: String) throws -> StoredSession? {
  guard let row = try AppMetrics.database?.getSessionWithChildren(id: id) else {
    return nil
  }
  return StoredSession(from: row)
}

struct MetricAttributes: Record {
  @Field var routeName: String?
  @Field var params: [String: Any]?
}
