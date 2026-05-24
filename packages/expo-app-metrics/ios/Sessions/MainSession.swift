// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Main session starts from launching the app to its termination. Some metrics like the app startup can only be tracked once and globally.
 In the future this class will also hold subsessions such as for time spent on a specific screen/route or user-initiated sessions.
 */
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

    AppMetricsActor.isolated { [self] in
      self.frameMetricsRecorder.start()
    }
  }

  /**
   Test-only initializer that builds a session with explicit values and skips registering it
   with the global storage. Do not use from production code.
   */
  init(id: String, startDate: Date, endDate: Date?) {
    super.init(id: id, type: .main, startDate: startDate, endDate: endDate)
  }

  // MARK: - Crash reports

  /**
   Persists a crash report attributed to this session. Replaces any previously stored report for
   this session id (only one crash per session is meaningful).
   */
  @AppMetricsActor
  func storeCrashReport(_ crashReport: CrashReport) {
    logger.warn("[AppMetrics] Received crash report:\n\(crashReport)")
    guard let payload = encodeAsJSONString(crashReport) else {
      return
    }
    do {
      try AppMetrics.database?.setCrashReport(sessionId: self.id, payload: payload)
    } catch {
      logger.warn("[AppMetrics] Failed to persist crash report for session \(self.id): \(error.localizedDescription)")
    }
  }
}
