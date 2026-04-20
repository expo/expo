// Copyright 2025-present 650 Industries. All rights reserved.
#if !os(tvOS)

import MetricKit

// For now let's just log data. Unfortunately debugging it is not so easy.
// - It doesn't work on simulator.
// - It must be an app on the App Store or TestFlight.
// - Can simulate from `Debug -> Simulate MetricKit Payloads` in Xcode but only on the device and the data are not real.
// We could use it as a source for metrics that we can't measure in other ways, e.g. CPU usage.

final class MetricKitSubscriber: NSObject, MXMetricManagerSubscriber, Sendable {
  override init() {
    super.init()

    // Even though MetricKit doesn't work on the simulator, it prints some logs (probably once a day)
    // that are piped to the terminal when using the `expo run:ios` command.
    // To avoid them, we explicitly don't register the subscriber on the simulator.
    // Example of the log:
    // [libapp_launch_measurement.dylib] Failed to send CA Event tor app launch measurements tor ca_event_type: o event_name: com.apple.app_launch_measurement.FirstFramePresentationMetric
    #if !targetEnvironment(simulator)
    // Auto registration
    MXMetricManager.shared.add(self)
    #endif
  }

  /**
   Receives payloads with performance metrics like CPU and memory usage.
   Sent periodically (usually every 24 hours), or when your app gets steady usage.
   */
  func didReceive(_ payloads: [MXMetricPayload]) {
    prettyPrintPayloads(payloads)
  }

  /**
   Receives payloads with diagnostic data like crash logs, hang reports, and more.
   Sent immediately when something critical happens — like a crash.
   */
  func didReceive(_ payloads: [MXDiagnosticPayload]) {
    prettyPrintPayloads(payloads)
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
