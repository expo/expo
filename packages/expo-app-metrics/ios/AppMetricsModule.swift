import ExpoModulesCore
import EXUpdatesInterface

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

    Function("logEvent") { (name: String, options: LogEventOptions?) in
      guard let validatedName = validateEventName(name) else {
        return
      }
      let validatedBody = validateEventBody(options?.body)
      let sanitized = sanitizeLogEventAttributes(options?.attributes)

      AppMetricsActor.isolated {
        AppMetrics.mainSession.receiveLog(
          LogRecord(
            name: validatedName,
            body: validatedBody,
            attributes: sanitized.attributes,
            droppedAttributesCount: sanitized.droppedCount,
            severity: options?.severity ?? .info
          )
        )
      }
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

    AsyncFunction("getAllSessions") { () -> [SessionSharedObject] in
      return try await AppMetricsActor.isolated {
        try AppMetrics.database?.getAllSessions().map(SessionSharedObject.init) ?? []
      }.value
    }

    AsyncFunction("getMainSession") { () -> SessionSharedObject? in
      return try await AppMetricsActor.isolated {
        let mainSessionId = AppMetrics.mainSession.id
        guard let row = try AppMetrics.database?.getSession(id: mainSessionId) else {
          return nil
        }
        return SessionSharedObject(row)
      }.value
    }

    // JS-bridge class name is "Session" so `instanceof ExpoAppMetrics.Session`
    // works as expected. Metrics, logs, and the crash report are read lazily
    // from the database, keyed by the session id captured on the shared object
    // at construction time — the JS handle stays cheap and doesn't keep any
    // domain object alive past its natural lifetime.
    Class("Session", SessionSharedObject.self) {
      Property("id") { (ref: SessionSharedObject) in ref.id }
      Property("type") { (ref: SessionSharedObject) in ref.type }
      Property("startDate") { (ref: SessionSharedObject) in ref.startDate }
      Property("endDate") { (ref: SessionSharedObject) in ref.endDate }

      AsyncFunction("getMetrics") { (ref: SessionSharedObject) -> [[String: Any]] in
        let sessionId = ref.id
        let rows: [MetricRow] = try await AppMetricsActor.isolated {
          try AppMetrics.database?.getMetrics(sessionId: sessionId) ?? []
        }.value
        return rows.map(metricRowAsJSObject)
      }

      AsyncFunction("getLogs") { (ref: SessionSharedObject) -> [[String: Any]] in
        let sessionId = ref.id
        let rows: [LogRow] = try await AppMetricsActor.isolated {
          try AppMetrics.database?.getLogs(sessionId: sessionId) ?? []
        }.value
        return rows.map(logRowAsJSObject)
      }

      AsyncFunction("addMetric") { (ref: SessionSharedObject, jsMetric: JsMetric) in
        let sessionId = ref.id
        try await AppMetricsActor.isolated {
          let metric = jsMetric.toMetric()
          try AppMetrics.database?.insert(metric: MetricRow.from(metric: metric, sessionId: sessionId))
        }.value
      }

      // Only the main session ever carries a crash report; every other session
      // type returns `nil` here. Exposing the function uniformly keeps the JS
      // surface symmetric with Android, where the call always returns `nil`
      // until crash reporting lands there. The payload is stored as a JSON
      // string by `MetricKitSubscriber`, so we hand the same bytes back to JS
      // without re-encoding through `CrashReport`.
      AsyncFunction("getCrashReport") { (ref: SessionSharedObject) -> [String: Any]? in
        let sessionId = ref.id
        let payload: String? = try await AppMetricsActor.isolated {
          try AppMetrics.database?.getCrashReport(sessionId: sessionId)
        }.value
        guard let payload, let data = payload.data(using: .utf8) else { return nil }
        return try JSONSerialization.jsonObject(with: data) as? [String: Any]
      }
    }

    Function("simulateCrashReport") {
      simulateCrashReport()
    }

    Function("triggerCrash") { (kind: CrashKind) in
      switch kind {
      case .badAccess: CrashTriggers.badAccess()
      case .fatalError: CrashTriggers.fatalErrorCrash()
      case .divideByZero: CrashTriggers.divideByZero()
      case .forceUnwrapNil: CrashTriggers.forceUnwrapNil()
      case .arrayOutOfBounds: CrashTriggers.arrayOutOfBounds()
      case .objcException: CrashTriggers.objcException()
      case .stackOverflow: CrashTriggers.stackOverflow()
      }
    }
  }

  public func updatesStateDidChange(_ event: [String : Any]) {
    if UpdatesStateEvent.fromDict(event)?.type ?? .restart == .downloadCompleteWithUpdate,
      let metric = AppMetrics.mainSession.updatesMonitor.downloadTimeMetric(subscription) {
      Task { @AppMetricsActor in
        AppMetrics.mainSession.updatesMonitor.reportMetric(metric)
      }
    }
  }
}

struct MetricAttributes: Record {
  @Field var routeName: String?
  @Field var params: [String: Any]?
}

enum CrashKind: String, Enumerable {
  /// EXC_BAD_ACCESS / SIGSEGV — dereference of a bogus pointer.
  case badAccess
  /// EXC_CRASH / SIGABRT — Swift `fatalError`.
  case fatalError
  /// EXC_ARITHMETIC / SIGFPE — integer divide by zero.
  case divideByZero
  /// EXC_BAD_INSTRUCTION — force-unwrap of a nil optional.
  case forceUnwrapNil
  /// EXC_BAD_INSTRUCTION — out-of-bounds Swift array access.
  case arrayOutOfBounds
  /// Uncaught Objective-C `NSException`, populates MetricKit's `exceptionReason`.
  case objcException
  /// Stack overflow via unbounded recursion.
  case stackOverflow
}
