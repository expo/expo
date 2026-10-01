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
      for crashReport in crashReports {
        do {
          try MetricsSinkRegistry.shared.record(crash: crashReport, log: crashReport.toLogRecord())
        } catch {
          logger.warn("[AppMetrics] Failed to record crash report: \(error.localizedDescription)")
        }
      }
    }
  }
}

#endif
