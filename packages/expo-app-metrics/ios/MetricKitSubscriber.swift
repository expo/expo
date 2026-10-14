// Copyright 2025-present 650 Industries. All rights reserved.
#if !os(tvOS)

import MetricKit

// Debugging MetricKit is not easy:
// - It doesn't work on simulator.
// - It must be an app on the App Store or TestFlight.
// - Can simulate from `Debug -> Simulate MetricKit Payloads` in Xcode but only on the device and the data are not real.

final class MetricKitSubscriber: NSObject, MXMetricManagerSubscriber, Sendable {
  /// Processes payloads that MetricKit retained from previous app launches. Call this after
  /// registering the subscriber with `MXMetricManager.shared.add(_:)` so MetricKit has
  /// acknowledged a subscriber for the current process.
  func processPastPayloads() {
    didReceive(MXMetricManager.shared.pastPayloads)
    didReceive(MXMetricManager.shared.pastDiagnosticPayloads)
  }

  // MARK: - MXMetricManagerSubscriber

  /// Receives payloads with performance metrics like CPU and memory usage.
  /// Sent periodically (usually every 24 hours), or when your app gets steady usage.
  ///
  /// We keep the launch and responsiveness histograms: the OS's time-to-first-draw over every
  /// launch in the window, measured without any instrumentation in the app.
  func didReceive(_ payloads: [MXMetricPayload]) {
    let reports = payloads.map(MetricKitLaunchReport.init(payload:)).filter { !$0.isEmpty }
    guard !reports.isEmpty else {
      return
    }
    AppMetricsActor.isolated {
      let mainSessions: [SessionRow]
      do {
        mainSessions = try AppMetrics.database?.getMainSessions() ?? []
      } catch {
        logger.warn(
          "[AppMetrics] Failed to load main sessions for launch metrics attribution: \(error.localizedDescription)"
        )
        return
      }
      for report in reports where AppMetricsUserDefaults.markMetricKitPayloadIngested(report.fingerprint) {
        guard let session = report.findMatchingSession(in: mainSessions) else {
          logger.warn("[AppMetrics] Received MetricKit launch metrics with no matching session.")
          continue
        }
        persistLaunchReport(report, sessionId: session.id)
      }
    }
  }

  /// Receives payloads with diagnostic data like crash logs, hang reports, and more.
  /// Delivered on the next app launch after the event occurs.
  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    let crashReports = payloads.flatMap { payload in
      return (payload.crashDiagnostics ?? []).map { diagnostic in
        return CrashReport(diagnostic: diagnostic, payload: payload)
      }
    }
    let hangReports = payloads.flatMap { payload -> [HangReport] in
      var reports = (payload.hangDiagnostics ?? []).map { HangReport(diagnostic: $0, payload: payload) }
      if #available(iOS 16.0, *) {
        reports += (payload.appLaunchDiagnostics ?? []).map { HangReport(diagnostic: $0, payload: payload) }
      }
      return reports
    }
    AppMetricsActor.isolated {
      let mainSessions: [SessionRow]
      do {
        mainSessions = try AppMetrics.database?.getMainSessions() ?? []
      } catch {
        logger.warn("[AppMetrics] Failed to load main sessions for crash attribution: \(error.localizedDescription)")
        return
      }
      for crashReport in crashReports {
        if let session = crashReport.findMatchingSession(in: mainSessions) {
          persistCrashReport(crashReport, sessionId: session.id)
        } else {
          logger.warn("[AppMetrics] Received crash report with no matching session:\n\(crashReport)")
        }
      }
      for hangReport in hangReports where AppMetricsUserDefaults.markMetricKitPayloadIngested(hangReport.fingerprint) {
        if let session = hangReport.findMatchingSession(in: mainSessions) {
          persistHangReport(hangReport, sessionId: session.id)
        } else {
          logger.warn("[AppMetrics] Received \(hangReport.kind.rawValue) diagnostic with no matching session.")
        }
      }
    }
  }
}

@AppMetricsActor
private func persistHangReport(_ hangReport: HangReport, sessionId: String) {
  do {
    guard try AppMetrics.database?.getSession(id: sessionId) != nil else {
      return
    }
    try AppMetrics.database?.insert(log: LogRow.from(log: hangReport.toLogRecord(), sessionId: sessionId))
  } catch {
    logger.warn("[AppMetrics] Failed to persist hang report for session \(sessionId): \(error.localizedDescription)")
  }
}

@AppMetricsActor
private func persistLaunchReport(_ report: MetricKitLaunchReport, sessionId: String) {
  do {
    guard try AppMetrics.database?.getSession(id: sessionId) != nil else {
      return
    }
    try AppMetrics.database?.insert(log: LogRow.from(log: report.toLogRecord(), sessionId: sessionId))
    for metric in report.toMetrics() {
      try AppMetrics.database?.insert(metric: MetricRow.from(metric: metric, sessionId: sessionId))
    }
  } catch {
    logger.warn("[AppMetrics] Failed to persist launch metrics for session \(sessionId): \(error.localizedDescription)")
  }
}

@AppMetricsActor
private func persistCrashReport(_ crashReport: CrashReport, sessionId: String) {
  guard let payload = encodeAsJSONString(crashReport) else {
    return
  }
  do {
    let log = LogRow.from(log: crashReport.toLogRecord(), sessionId: sessionId)
    try AppMetrics.database?.storeCrashReportIfNew(sessionId: sessionId, payload: payload, log: log)
  } catch {
    logger.warn("[AppMetrics] Failed to persist crash report for session \(sessionId): \(error.localizedDescription)")
  }
}

#endif
