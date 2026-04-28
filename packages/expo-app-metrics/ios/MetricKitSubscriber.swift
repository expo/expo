// Copyright 2025-present 650 Industries. All rights reserved.
#if !os(tvOS)

import MetricKit

// For now let's just log data. Unfortunately debugging it is not so easy.
// - It doesn't work on simulator.
// - It must be an app on the App Store or TestFlight.
// - Can simulate from `Debug -> Simulate MetricKit Payloads` in Xcode but only on the device and the data are not real.
// We could use it as a source for metrics that we can't measure in other ways, e.g. CPU usage.

final class MetricKitSubscriber: NSObject, MXMetricManagerSubscriber, Sendable {
  /**
   Receives payloads with performance metrics like CPU and memory usage.
   Sent periodically (usually every 24 hours), or when your app gets steady usage.
   */
  func didReceive(_ payloads: [MXMetricPayload]) {
    prettyPrintPayloads(payloads)
  }

  /**
   Receives payloads with diagnostic data like crash logs, hang reports, and more.
   Delivered on the next app launch after the event occurs.
   */
  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    prettyPrintPayloads(payloads)

    let crashReports = payloads.flatMap { payload in
      return (payload.crashDiagnostics ?? []).map { diagnostic in
        return CrashReport(diagnostic: diagnostic, payload: payload)
      }
    }
    AppMetricsActor.isolated {
      let mainSessions = AppMetrics.storage.getAllMainSessions()
      var didStoreAny = false
      for crashReport in crashReports {
        if let session = crashReport.findMatchingSession(in: mainSessions) {
          session.storeCrashReport(crashReport)
          didStoreAny = true
        } else {
          logger.warn("[AppMetrics] Received crash report with no matching session:\n\(crashReport)")
        }
      }
      if didStoreAny {
        try? AppMetrics.storage.commit()
      }
    }
  }
}

private func prettyPrintPayloads(_ payloads: [MXPayload]) {
  for payload in payloads {
    if let json = try? JSONSerialization.jsonObject(with: payload.jsonRepresentation()),
       let data = try? JSONSerialization.data(withJSONObject: json, options: [.prettyPrinted]) {
      // For now let's just log data.
      print(String(decoding: data, as: UTF8.self))
    }
  }
}

private protocol MXPayload {
  func jsonRepresentation() -> Data
}

extension MXMetricPayload: MXPayload {}
extension MXDiagnosticPayload: MXPayload {}
#endif
