// Copyright 2025-present 650 Industries. All rights reserved.
#if !os(tvOS)

import MetricKit

// For now let's just log data. Unfortunately debugging it is not so easy.
// - It doesn't work on simulator.
// - It must be an app on the App Store or TestFlight.
// - Can simulate from `Debug -> Simulate MetricKit Payloads` in Xcode but only on the device and the data are not real.
// We could use it as a source for metrics that we can't measure in other ways, e.g. CPU usage.

final class MetricKitSubscriber: NSObject, MXMetricManagerSubscriber, Sendable {
  /// Processes payloads that MetricKit retained from previous app launches. Call this after
  /// registering the subscriber with `MXMetricManager.shared.add(_:)` so MetricKit has
  /// acknowledged a subscriber for the current process.
  func processPastPayloads() {
    didReceive(MXMetricManager.shared.pastPayloads)
    didReceive(MXMetricManager.shared.pastDiagnosticPayloads)
  }

  /// Stores each crash report under the main session it belongs to. A crashed process with no stored
  /// session gets a new session built from the crash report, so the crash is sent with its own app version.
  @AppMetricsActor
  static func storeCrashReports(_ crashReports: [CrashReport], in database: MetricsDatabase) {
    var mainSessions: [SessionRow]
    do {
      mainSessions = try database.getMainSessions()
    } catch {
      logger.warn("[AppMetrics] Failed to load main sessions for crash attribution: \(error.localizedDescription)")
      return
    }
    for crashReport in crashReports {
      if let session = crashReport.findMatchingSession(in: mainSessions) {
        persistCrashReport(crashReport, sessionId: session.id, in: database)
      } else if crashReport.processId != nil {
        let environment = AppMetricsUserDefaults.environment ?? AppMetricsUserDefaults.getDefaultEnvironment()
        let session = SessionRow.forCrashedProcess(crashReport, storedSessions: mainSessions, environment: environment)
        do {
          try database.insert(session: session)
        } catch {
          logger.warn("[AppMetrics] Failed to insert a session for a crashed process: \(error.localizedDescription)")
          continue
        }
        // A later report in this batch for the same process must match this session.
        mainSessions.append(session)
        persistCrashReport(crashReport, sessionId: session.id, in: database)
      } else {
        logger.warn("[AppMetrics] Received crash report with no matching session:\n\(crashReport)")
      }
    }
  }

  // MARK: - MXMetricManagerSubscriber

  /// Receives payloads with performance metrics like CPU and memory usage.
  /// Sent periodically (usually every 24 hours), or when your app gets steady usage.
  func didReceive(_ payloads: [MXMetricPayload]) {}

  /// Receives payloads with diagnostic data like crash logs, hang reports, and more.
  /// Delivered on the next app launch after the event occurs.
  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    let crashReports = payloads.flatMap { payload in
      return (payload.crashDiagnostics ?? []).map { diagnostic in
        return CrashReport(diagnostic: diagnostic, payload: payload)
      }
    }
    AppMetricsActor.isolated {
      guard let database = AppMetrics.database else {
        return
      }
      Self.storeCrashReports(crashReports, in: database)
    }
  }
}

@AppMetricsActor
private func persistCrashReport(_ crashReport: CrashReport, sessionId: String, in database: MetricsDatabase) {
  guard let payload = encodeAsJSONString(crashReport) else {
    return
  }
  do {
    let log = LogRow.from(log: crashReport.toLogRecord(), sessionId: sessionId)
    try database.storeCrashReportIfNew(sessionId: sessionId, payload: payload, log: log)
  } catch {
    logger.warn("[AppMetrics] Failed to persist crash report for session \(sessionId): \(error.localizedDescription)")
  }
}

#endif
