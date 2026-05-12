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

    AsyncFunction("getStoredEntries") { () -> [Any] in
      let entries = await AppMetrics.storage.getAllEntries()
      let encoder = JSONEncoder()
      encoder.dateEncodingStrategy = .iso8601
      let data = try encoder.encode(entries)
      return (try JSONSerialization.jsonObject(with: data) as? [Any]) ?? []
    }

    AsyncFunction("clearStoredEntries") {
      return try await AppMetrics.storage.clear()
    }

    AsyncFunction("getAllSessions") { () -> [Any] in
      let sessions = await AppMetrics.storage.getAllSessions()
      let encoder = JSONEncoder()
      encoder.dateEncodingStrategy = .iso8601
      let data = try encoder.encode(sessions.map(SessionCoder.init))
      return (try JSONSerialization.jsonObject(with: data) as? [Any]) ?? []
    }

    AsyncFunction("addCustomMetricToSession") { (metric: JsMetric) in
      try await AppMetricsActor.isolated {
        AppMetrics.storage.findSession(byId: metric.sessionId)?.receiveMetric(metric.toMetric())
      }
    }

    AsyncFunction("getMainSession") { () -> [String: Any]? in
      // Snapshot + encode on the actor so we don't race metric writes, then
      // return the encoded JSON `Data` (Sendable) for off-actor parsing.
      let (mainSessionId, data) = try await AppMetricsActor.isolated { () -> (String, Data) in
        let mainSession = AppMetrics.mainSession
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return (mainSession.id, try encoder.encode(SessionCoder(mainSession)))
      }
      guard var dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        return nil
      }
      // Inject `sessionId` on each metric so the payload matches the TS
      // `Metric` shape, which carries sessionId per-metric
      if let metrics = dict["metrics"] as? [[String: Any]] {
        dict["metrics"] = metrics.map { metric -> [String: Any] in
          var withSessionId = metric
          withSessionId["sessionId"] = mainSessionId
          return withSessionId
        }
      }
      return dict
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
