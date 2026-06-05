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

    AsyncFunction("getAllSessions") { () -> [SessionRef] in
      // Read both the rows and the crash-report id set inside the same actor hop so the snapshot
      // is internally consistent. Only the Sendable row snapshots cross the actor boundary; the
      // refs are hydrated and wrapped outside because `SharedObject` subclasses are not Sendable.
      let (rows, crashedSessionIds) = try await AppMetricsActor.isolated {
        () -> ([SessionRow], Set<String>) in
        guard let database = AppMetrics.database else {
          return ([], [])
        }
        return (try database.getAllSessions(), try database.getSessionIdsWithCrashReports())
      }
      return rows.map { row in
        SessionRef(row.toSession(), hasCrashReport: crashedSessionIds.contains(row.id))
      }
    }

    Function("getMainSession") { () -> SessionRef in
      // Wraps the live `MainSession` instance, so the JS handle keeps the native session alive
      // without any id registry.
      // `hasCrashReport` is a best-effort `false` snapshot: MetricKit attributes crash reports to
      // *past* launches, never the running process, so the live main session can't have one yet.
      return SessionRef(AppMetrics.mainSession, hasCrashReport: false)
    }

    Class("Session", SessionRef.self) {
      Property("id") { $0.ref.id }
      Property("type") { $0.ref.type.rawValue }
      Property("startDate") { $0.ref.startDate.ISO8601Format() }
      Property("hasCrashReport") { $0.hasCrashReport }

      // `isActive`/`getEndDate` read the row live instead of the wrapped `Session`: sessions
      // hydrated from rows are frozen projections, so only the database reflects a session that
      // ended after the handle was captured.
      AsyncFunction("isActive") { (session: SessionRef) -> Bool in
        let sessionId = session.ref.id
        return try await AppMetricsActor.isolated {
          return try AppMetrics.database?.getSession(id: sessionId)?.isActive ?? true
        }.value
      }

      AsyncFunction("getEndDate") { (session: SessionRef) -> String? in
        let sessionId = session.ref.id
        return try await AppMetricsActor.isolated {
          return try AppMetrics.database?.getSession(id: sessionId)?.endTimestamp
        }.value
      }

      AsyncFunction("getMetrics") { (session: SessionRef) -> [Metric] in
        let sessionId = session.ref.id
        return try await AppMetricsActor.isolated {
          let rows = try AppMetrics.database?.getMetrics(sessionId: sessionId) ?? []
          return decodeMetrics(from: rows)
        }.value
      }

      AsyncFunction("addMetric") { (session: SessionRef, input: SessionMetricInput) in
        let sessionId = session.ref.id
        try await AppMetricsActor.isolated {
          let metric = input.toMetric(sessionId: sessionId)
          try AppMetrics.database?.insert(metric: MetricRow.from(metric: metric, sessionId: sessionId))
        }.value
      }

      AsyncFunction("getLogs") { (session: SessionRef) -> [LogRecord] in
        let sessionId = session.ref.id
        return try await AppMetricsActor.isolated {
          let rows = try AppMetrics.database?.getLogs(sessionId: sessionId) ?? []
          return decodeLogs(from: rows)
        }.value
      }

      AsyncFunction("getCrashReport") { (session: SessionRef) -> CrashReport? in
        let sessionId = session.ref.id
        return try await AppMetricsActor.isolated {
          let payload = try AppMetrics.database?.getCrashReport(sessionId: sessionId)
          return decodeFromJSONString(CrashReport.self, from: payload)
        }.value
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
