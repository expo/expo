// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Main session starts from launching the app to its termination. Some metrics like the app startup can only be tracked once and globally.
/// In the future this class will also hold subsessions such as for time spent on a specific screen/route or user-initiated sessions.
public final class MainSession: Session, @unchecked Sendable {
  let appStartupMonitor = AppStartupMonitoring()
  let updatesMonitor = UpdatesMonitoring()
  let frameMetricsRecorder = FrameMetricsRecorder()

  // MARK: - Metrics

  init() {
    super.init(type: .main)
    self.appStartupMonitor.addReceiver(self)
    self.updatesMonitor.addReceiver(self)

    #if !os(tvOS)
    AppMetrics.registerMetricKitSubscriber()
    #endif

    // Ingest fatal JS errors that a previous launch wrote to disk before terminating.
    AppMetrics.ingestPendingErrors()

    AppMetricsActor.isolated { [self] in
      self.frameMetricsRecorder.start()
    }
  }

  /// Startup metrics received while consent is not granted. A grant saves them.
  @AppMetricsActor
  private var unsavedStartupMetrics: [Metric] = []

  @AppMetricsActor
  public override func receiveMetric(_ metric: Metric) {
    if !ObserveConsent.isGranted && metric.category == .appStartup {
      unsavedStartupMetrics.append(metric)
      return
    }
    super.receiveMetric(metric)
  }

  @AppMetricsActor
  func saveUnsavedStartupMetrics() {
    for metric in unsavedStartupMetrics {
      super.receiveMetric(metric)
    }
    unsavedStartupMetrics = []
  }

  /// Test-only initializer that builds a session with explicit values and skips registering it
  /// with the global storage. Do not use from production code.
  init(id: String, startDate: Date, endDate: Date?) {
    super.init(id: id, type: .main, startDate: startDate, endDate: endDate)
  }
}
