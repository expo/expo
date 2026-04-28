// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Main session starts from launching the app to its termination. Some metrics like the app startup can only be tracked once and globally.
 In the future this class will also hold subsessions such as for time spent on a specific screen/route or user-initiated sessions.
 */
public final class MainSession: Session, @unchecked Sendable {
  let appStartupMonitor = AppStartupMonitoring()
  let updatesMonitor = UpdatesMonitoring()
  let frameMetricsRecorder = FrameMetricsRecorder()

  /**
   Crash report associated with this session, if the app crashed during it.
   Mutations go through `storeCrashReport(_:)` so they happen on the actor.
   */
  nonisolated(unsafe) public private(set) var crashReport: CrashReport?

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
   Stores a crash report on this session and logs it. The caller is responsible for
   committing the storage.
   */
  @AppMetricsActor
  func storeCrashReport(_ crashReport: CrashReport) {
    logger.warn("[AppMetrics] Received crash report:\n\(crashReport)")
    self.crashReport = crashReport
  }

  // MARK: - Codable

  private enum CodingKeys: String, CodingKey {
    case crashReport
  }

  required init(from decoder: any Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)
    crashReport = try values.decodeIfPresent(CrashReport.self, forKey: .crashReport)
    try super.init(from: decoder)
  }

  public override func encode(to encoder: any Encoder) throws {
    try super.encode(to: encoder)
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encodeIfPresent(crashReport, forKey: .crashReport)
  }
}
