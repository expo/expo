// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Main session starts from launching the app to its termination. Some metrics like the app startup can only be tracked once and globally.
 In the future this class will also hold subsessions such as for time spent on a specific screen/route or user-initiated sessions.
 */
internal final class MainSession: Session, @unchecked Sendable {
  let appStartupMonitor = AppStartupMonitoring()
  let updatesMonitor = UpdatesMonitoring()
  let frameMetricsRecorder = FrameMetricsRecorder()

  // MARK: - Metrics

  init() {
    super.init(type: .main)
    self.appStartupMonitor.addReceiver(self)
    self.updatesMonitor.addReceiver(self)

    AppMetricsActor.isolated { [self] in
      self.frameMetricsRecorder.start()
    }
  }

  // MARK: - Codable

  required init(from decoder: any Decoder) throws {
    try super.init(from: decoder)
  }
}
