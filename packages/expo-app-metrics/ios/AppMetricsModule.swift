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
      return try await AppMetricsActor.isolated {
        let sessions = try AppMetrics.database.getAllSessionsWithChildren()
        return sessions.map { encodeSessionWithChildren($0) }
      }.value
    }

    AsyncFunction("clearStoredEntries") {
      try await AppMetricsActor.isolated {
        try AppMetrics.database.deleteAllSessions()
      }.value
    }

    AsyncFunction("getAllSessions") { () -> [Any] in
      return try await AppMetricsActor.isolated {
        let sessions = try AppMetrics.database.getAllSessionsWithChildren()
        return sessions.map { encodeSessionWithChildren($0) }
      }.value
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

/**
 Serializes a session row with its children into the `[String: Any]` shape JS expects. Mirrors the
 fields the JSON-era `Entry`+`Session` Codable encoding produced, so the JS bridge contract stays
 stable across the SQLite cutover.
 */
private func encodeSessionWithChildren(_ row: SessionWithChildren) -> [String: Any] {
  let session = row.session
  var dict: [String: Any] = [
    "id": session.id,
    "type": session.type,
    "startTimestamp": session.startTimestamp,
    "isActive": session.isActive,
    "metrics": row.metrics.map { encodeMetric($0) },
    "logs": row.logs.map { encodeLog($0) }
  ]
  if let endTimestamp = session.endTimestamp {
    dict["endTimestamp"] = endTimestamp
  }
  if let environment = session.environment {
    dict["environment"] = environment
  }
  if let appName = session.appName { dict["appName"] = appName }
  if let appIdentifier = session.appIdentifier { dict["appIdentifier"] = appIdentifier }
  if let appVersion = session.appVersion { dict["appVersion"] = appVersion }
  if let appBuildNumber = session.appBuildNumber { dict["appBuildNumber"] = appBuildNumber }
  if let appUpdateId = session.appUpdateId { dict["appUpdateId"] = appUpdateId }
  if let appUpdateRuntimeVersion = session.appUpdateRuntimeVersion { dict["appUpdateRuntimeVersion"] = appUpdateRuntimeVersion }
  if let appEasBuildId = session.appEasBuildId { dict["appEasBuildId"] = appEasBuildId }
  if let deviceOs = session.deviceOs { dict["deviceOs"] = deviceOs }
  if let deviceOsVersion = session.deviceOsVersion { dict["deviceOsVersion"] = deviceOsVersion }
  if let deviceModel = session.deviceModel { dict["deviceModel"] = deviceModel }
  if let deviceName = session.deviceName { dict["deviceName"] = deviceName }
  if let expoSdkVersion = session.expoSdkVersion { dict["expoSdkVersion"] = expoSdkVersion }
  if let reactNativeVersion = session.reactNativeVersion { dict["reactNativeVersion"] = reactNativeVersion }
  if let clientVersion = session.clientVersion { dict["clientVersion"] = clientVersion }
  if let languageTag = session.languageTag { dict["languageTag"] = languageTag }
  if let crashReportJSON = row.crashReportJSON,
     let data = crashReportJSON.data(using: .utf8),
     let parsed = try? JSONSerialization.jsonObject(with: data) {
    dict["crashReport"] = parsed
  }
  return dict
}

private func encodeMetric(_ metric: MetricRow) -> [String: Any] {
  var dict: [String: Any] = [
    "id": metric.id ?? -1,
    "sessionId": metric.sessionId,
    "name": metric.name,
    "value": metric.value,
    "timestamp": metric.timestamp
  ]
  if let category = metric.category { dict["category"] = category }
  if let routeName = metric.routeName { dict["routeName"] = routeName }
  if let updateId = metric.updateId { dict["updateId"] = updateId }
  if let params = metric.params,
     let data = params.data(using: .utf8),
     let parsed = try? JSONSerialization.jsonObject(with: data) {
    dict["params"] = parsed
  }
  return dict
}

private func encodeLog(_ log: LogRow) -> [String: Any] {
  var dict: [String: Any] = [
    "id": log.id ?? -1,
    "sessionId": log.sessionId,
    "name": log.name,
    "severity": log.severity,
    "timestamp": log.timestamp,
    "droppedAttributesCount": log.droppedAttributesCount
  ]
  if let body = log.body { dict["body"] = body }
  if let attributes = log.attributes,
     let data = attributes.data(using: .utf8),
     let parsed = try? JSONSerialization.jsonObject(with: data) {
    dict["attributes"] = parsed
  }
  return dict
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
