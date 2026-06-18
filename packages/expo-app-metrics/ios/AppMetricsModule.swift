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

    // Convenience wrapper that records against the main session. Validation and record building
    // happen here (via `makeLogRecord`); the session only persists, stamping its own id in
    // `receiveLog`. `getMainSession()` returns this same `mainSession` instance.
    Function("logEvent") { (name: String, options: LogEventOptions?) in
      guard let record = makeLogRecord(name: name, options: options) else {
        return
      }
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

      // Builds the record here (like the module-level `logEvent`) and lets the session persist it
      // under its own id via `receiveLog`. Best-effort, unlike `addMetric`: an invalid event or a
      // failed insert resolves the promise rather than rejecting it, since logging is telemetry that
      // shouldn't surface errors to the app.
      AsyncFunction("logEvent") { (session: Session, name: String, options: LogEventOptions?) in
        guard let record = makeLogRecord(name: name, options: options) else {
          return
        }
        try await AppMetricsActor.isolated { session.receiveLog(record) }.value
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
