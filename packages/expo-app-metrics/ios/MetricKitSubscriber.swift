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
          logCrashEvent(crashReport, sessionId: session.id)
        } else {
          logger.warn("[AppMetrics] Received crash report with no matching session:\n\(crashReport)")
        }
      }
    }
  }
}

@AppMetricsActor
private func persistCrashReport(_ crashReport: CrashReport, sessionId: String) {
  guard let payload = encodeAsJSONString(crashReport) else {
    return
  }
  do {
    try AppMetrics.database?.setCrashReport(sessionId: sessionId, payload: payload)
  } catch {
    logger.warn("[AppMetrics] Failed to persist crash report for session \(sessionId): \(error.localizedDescription)")
  }
}

/// Records an `expo.session.crashed` log event on the session the crash was attributed to, marking
/// that the session ended in a crash. This is an SDK-internal event, so it's built directly rather
/// than going through the JS-facing `logEvent` path — that path rejects the reserved `expo.` name
/// prefix and strips `expo.*` attributes, both of which the SDK owns here.
@AppMetricsActor
private func logCrashEvent(_ crashReport: CrashReport, sessionId: String) {
  let record = LogRecord(
    name: "expo.session.crashed",
    attributes: crashReport.eventAttributes,
    severity: .fatal,
    timestamp: crashReport.ingestedAt
  )
  do {
    try AppMetrics.database?.insert(log: LogRow.from(log: record, sessionId: sessionId))
  } catch {
    logger.warn("[AppMetrics] Failed to log crash event for session \(sessionId): \(error.localizedDescription)")
  }
}

#endif
