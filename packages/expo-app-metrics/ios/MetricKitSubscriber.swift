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

  /// Stores each hang as a log on its session and returns the new cursor: the newest payload end
  /// seen. MetricKit can deliver a past payload again on a later launch, so hangs from payloads that
  /// end at or before `cursor` are skipped. A hang with no matching session is dropped.
  ///
  /// The cursor lives in user defaults, not in the database transaction. If the app dies between the
  /// two writes, the payload's hangs are stored twice. We accept that rare duplicate.
  @AppMetricsActor
  static func storeHangReports(
    _ hangReports: [HangReport],
    in database: MetricsDatabase,
    after cursor: Date?
  ) -> Date? {
    let newReports = hangReports.filter { report in cursor.map { report.timestampEnd > $0 } ?? true }
    guard let newCursor = newReports.map(\.timestampEnd).max() else {
      return cursor
    }
    do {
      let mainSessions = try database.getMainSessions()
      let logs = newReports.compactMap { report in
        report.findMatchingSession(in: mainSessions).map { LogRow.from(log: report.toLogRecord(), sessionId: $0.id) }
      }
      try database.insertAll(logs: logs)
    } catch {
      logger.warn("[AppMetrics] Failed to store app hangs: \(error.localizedDescription)")
      return cursor
    }
    return newCursor
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
    // Skip replayed payloads here, so their hangs are not symbolicated again on every launch.
    let hangCursor = AppMetricsUserDefaults.lastStoredHangPayloadEnd
    let newHangPayloads = payloads.filter { payload in hangCursor.map { payload.timeStampEnd > $0 } ?? true }
    let hangReports = newHangPayloads.flatMap { payload in
      return (payload.hangDiagnostics ?? []).map { diagnostic in
        return HangReport(diagnostic: diagnostic, payload: payload)
      }
    }
    AppMetricsActor.isolated {
      guard let database = AppMetrics.database else {
        return
      }
      Self.storeCrashReports(crashReports, in: database)
      AppMetricsUserDefaults.lastStoredHangPayloadEnd = Self.storeHangReports(
        hangReports,
        in: database,
        after: AppMetricsUserDefaults.lastStoredHangPayloadEnd
      )
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
