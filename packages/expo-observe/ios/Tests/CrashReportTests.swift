import Testing

@testable import ExpoObserve

@AppMetricsActor
@Suite("CrashReport")
struct CrashReportTests {
  @AppMetricsActor
  @Suite("findMatchingSession")
  struct FindMatchingSessionTests {
    @Test
    func `prefers an unfinished session inside the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let unfinished = makeMainSessionRow(
        id: "unfinished",
        startDate: windowEnd.addingTimeInterval(-1800),
        endDate: nil
      )
      let finished = makeMainSessionRow(
        id: "finished",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: windowEnd.addingTimeInterval(-600)
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [finished, unfinished])
      #expect(match?.id == "unfinished")
    }

    @Test
    func `picks the latest unfinished session when multiple are in the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let earlier = makeMainSessionRow(
        id: "earlier",
        startDate: windowEnd.addingTimeInterval(-2400),
        endDate: nil
      )
      let later = makeMainSessionRow(
        id: "later",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: nil
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [earlier, later])
      #expect(match?.id == "later")
    }

    @Test
    func `falls back to the latest finished session in the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let earlier = makeMainSessionRow(
        id: "earlier",
        startDate: windowEnd.addingTimeInterval(-2400),
        endDate: windowEnd.addingTimeInterval(-2000)
      )
      let later = makeMainSessionRow(
        id: "later",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: windowEnd.addingTimeInterval(-600)
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [earlier, later])
      #expect(match?.id == "later")
    }

    @Test
    func `matches a session whose interval intersects the window even if its start predates the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      // Session started before the window but is still active when the window begins,
      // so it intersects the payload window and should match.
      let spanning = makeMainSessionRow(
        id: "spanning",
        startDate: windowStart.addingTimeInterval(-1000),
        endDate: nil
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [spanning])
      #expect(match?.id == "spanning")
    }

    @Test
    func `falls back to the latest unfinished session when nothing intersects (zero-width window)`() {
      // Simulated MetricKit payloads have timestampBegin == timestampEnd == now,
      // so no historical session can possibly intersect. Fall back to the latest unfinished one.
      let now = Date.now

      let oldFinished = makeMainSessionRow(
        id: "old-finished",
        startDate: now.addingTimeInterval(-7200),
        endDate: now.addingTimeInterval(-7000)
      )
      let unfinished = makeMainSessionRow(
        id: "unfinished",
        startDate: now.addingTimeInterval(-3600),
        endDate: nil
      )

      let report = makeCrashReport(timestampBegin: now, timestampEnd: now)
      let match = report.findMatchingSession(in: [oldFinished, unfinished])
      #expect(match?.id == "unfinished")
    }

    @Test
    func `falls back to the latest session by start date when nothing intersects and none are unfinished`() {
      let now = Date.now

      let earlier = makeMainSessionRow(
        id: "earlier",
        startDate: now.addingTimeInterval(-7200),
        endDate: now.addingTimeInterval(-7000)
      )
      let later = makeMainSessionRow(
        id: "later",
        startDate: now.addingTimeInterval(-3600),
        endDate: now.addingTimeInterval(-3500)
      )

      let report = makeCrashReport(timestampBegin: now, timestampEnd: now)
      let match = report.findMatchingSession(in: [earlier, later])
      #expect(match?.id == "later")
    }

    @Test
    func `returns nil for a real (non-zero-width) window that intersects no session`() {
      // A real MetricKit payload from a 24-hour bucket that doesn't overlap any
      // session must NOT be silently misattributed to the current unfinished session.
      let windowEnd = Date.now.addingTimeInterval(-86400)
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let unfinishedToday = makeMainSessionRow(
        id: "unfinished-today",
        startDate: Date.now.addingTimeInterval(-60),
        endDate: nil
      )
      let finishedToday = makeMainSessionRow(
        id: "finished-today",
        startDate: Date.now.addingTimeInterval(-3600),
        endDate: Date.now.addingTimeInterval(-1800)
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [unfinishedToday, finishedToday])
      #expect(match == nil)
    }

    @Test
    func `returns nil when the input is empty`() {
      let report = makeCrashReport(
        timestampBegin: Date.now.addingTimeInterval(-3600),
        timestampEnd: Date.now
      )
      #expect(report.findMatchingSession(in: []) == nil)
    }

    @Test
    func `matches the session of the crashed process`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let crashed = makeMainSessionRow(
        id: "crashed",
        startDate: windowEnd.addingTimeInterval(-2400),
        endDate: nil,
        processId: 100
      )
      let later = makeMainSessionRow(
        id: "later",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: nil,
        processId: 200
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: 100)
      let match = report.findMatchingSession(in: [crashed, later])
      #expect(match?.id == "crashed")
    }

    @Test
    func `returns nil when no session belongs to the crashed process`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let earlier = makeMainSessionRow(
        id: "earlier",
        startDate: windowEnd.addingTimeInterval(-2400),
        endDate: nil,
        processId: 100
      )
      let later = makeMainSessionRow(
        id: "later",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: nil,
        processId: 200
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: 300)
      let match = report.findMatchingSession(in: [earlier, later])
      #expect(match == nil)
    }

    @Test
    func `ignores a session of the crashed process ID that ended before the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      // Process IDs repeat, for example after a reboot.
      let previousBoot = makeMainSessionRow(
        id: "previous-boot",
        startDate: windowEnd.addingTimeInterval(-172_800),
        endDate: windowEnd.addingTimeInterval(-172_000),
        processId: 100
      )
      let other = makeMainSessionRow(
        id: "other",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: nil,
        processId: 200
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: 100)
      let match = report.findMatchingSession(in: [previousBoot, other])
      #expect(match == nil)
    }
  }

  #if !os(tvOS)
  @AppMetricsActor
  @Suite("storeCrashReports")
  struct StoreCrashReportsTests {
    @Test
    func `drops windows that began before consent before matching or creating sessions`() throws {
      try withTemporaryDatabase { database in
        let grant = Date.now
        let before = grant.addingTimeInterval(-60)
        let after = grant.addingTimeInterval(60)
        try database.insert(session: makeMainSessionRow(id: "existing", startDate: grant, endDate: nil))
        let reports = [
          makeCrashReport(timestampBegin: before, timestampEnd: after),
          makeCrashReport(timestampBegin: before, timestampEnd: after, processId: 100),
          makeCrashReport(timestampBegin: grant, timestampEnd: after, processId: 200),
          makeCrashReport(timestampBegin: after, timestampEnd: after, processId: 300),
        ]

        MetricKitSubscriber.storeCrashReports(reports, in: database, consentStart: grant)

        let sessions = try database.getMainSessions()
        #expect(try database.getLogs(sessionId: "existing").isEmpty)
        #expect(sessions.compactMap(\.processId).sorted() == [200, 300])
        for session in sessions where session.processId != nil {
          #expect(try database.getLogs(sessionId: session.id).map(\.name) == [nativeExceptionLogName])
        }
      }
    }

    @Test
    func `stores a crash of a process with no session under a new session`() throws {
      try withTemporaryDatabase { database in
        let report = makeCrashReport(
          timestampBegin: Date.now.addingTimeInterval(-3600),
          timestampEnd: Date.now.addingTimeInterval(-60),
          appBuildNumber: "14",
          processId: 822
        )

        MetricKitSubscriber.storeCrashReports([report], in: database)

        let session = try #require(try database.getMainSessions().first { $0.processId == 822 })
        #expect(session.appBuildNumber == "14")
        #expect(try database.getLogs(sessionId: session.id).map(\.name) == [nativeExceptionLogName])
      }
    }

    @Test
    func `stores a redelivered crash of a process with no session only once`() throws {
      try withTemporaryDatabase { database in
        let report = makeCrashReport(
          timestampBegin: Date.now.addingTimeInterval(-3600),
          timestampEnd: Date.now.addingTimeInterval(-60),
          processId: 822
        )

        MetricKitSubscriber.storeCrashReports([report], in: database)
        MetricKitSubscriber.storeCrashReports([report], in: database)

        let sessions = try database.getMainSessions().filter { $0.processId == 822 }
        try #require(sessions.count == 1)
        #expect(try database.getLogs(sessionId: sessions[0].id).count == 1)
      }
    }

    @Test
    func `stores crashes of different processes in one payload under their own sessions`() throws {
      try withTemporaryDatabase { database in
        let windowEnd = Date.now.addingTimeInterval(-60)
        let windowStart = windowEnd.addingTimeInterval(-3600)
        try database.insert(
          session: makeMainSessionRow(id: "process-100", startDate: windowStart, endDate: nil, processId: 100)
        )
        let reports = [100, 822].map { processId in
          makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: processId)
        }

        MetricKitSubscriber.storeCrashReports(reports, in: database)

        let sessions = try database.getMainSessions()
        try #require(sessions.count == 2)
        for session in sessions {
          #expect(try database.getLogs(sessionId: session.id).count == 1)
        }
      }
    }
  }
  #endif

  @Suite("SessionRow.forCrashedProcess")
  struct ForCrashedProcessTests {
    @Test
    func `takes the app version, build number and OS version from the crash report`() {
      let crashTime = Date(timeIntervalSince1970: 1_700_000_000)
      let report = makeCrashReport(
        timestampBegin: crashTime.addingTimeInterval(-3600),
        timestampEnd: crashTime,
        appBuildNumber: "14",
        osVersion: "iPhone OS 17.6.1 (21G93)",
        processId: 822
      )

      let session = SessionRow.forCrashedProcess(
        report,
        storedSessions: [],
        environment: "production",
        app: makeAppInfo(buildNumber: "15"),
        device: testDevice
      )

      #expect(session.type == Session.SessionType.main.rawValue)
      #expect(session.appVersion == "1.0.0")
      #expect(session.appBuildNumber == "14")
      #expect(session.deviceOsVersion == "17.6.1")
      #expect(session.processId == 822)
      #expect(session.startTimestamp == crashTime.ISO8601Format())
      #expect(session.endTimestamp == crashTime.ISO8601Format())
      #expect(session.isActive == false)
      #expect(session.expoSdkVersion == nil)
      #expect(session.appUpdateId == nil)
    }

    @Test
    func `copies the build details from the newest stored session of the same build`() {
      let report = makeCrashReport(
        timestampBegin: Date.now.addingTimeInterval(-3600),
        timestampEnd: Date.now,
        appBuildNumber: "14",
        processId: 822
      )
      let storedSessions = [
        makeBuildSessionRow(buildNumber: "14", startTimestamp: "2026-11-01T10:00:00Z", expoSdkVersion: "58.0.0"),
        makeBuildSessionRow(buildNumber: "14", startTimestamp: "2026-11-02T10:00:00Z", expoSdkVersion: "58.0.1"),
        makeBuildSessionRow(buildNumber: "15", startTimestamp: "2026-11-03T10:00:00Z", expoSdkVersion: "59.0.0"),
      ]

      let session = SessionRow.forCrashedProcess(
        report,
        storedSessions: storedSessions,
        environment: "production",
        app: makeAppInfo(buildNumber: "15"),
        device: testDevice
      )

      #expect(session.expoSdkVersion == "58.0.1")
      #expect(session.reactNativeVersion == "0.86.0")
      #expect(session.appEasBuildId == "eas-build-14")
    }
  }

  @Suite("toLogRecord")
  struct ToLogRecordTests {
    @Test
    func `builds a fatal exception log for a Mach exception`() throws {
      let timestampEnd = Date(timeIntervalSince1970: 1_699_999_000)
      let ingestedAt = Date(timeIntervalSince1970: 1_700_000_000)
      let report = makeCrashReport(
        timestampBegin: timestampEnd.addingTimeInterval(-3600),
        timestampEnd: timestampEnd,
        ingestedAt: ingestedAt,
        exceptionType: 1,
        exceptionCode: 2,
        signal: 11,
        terminationReason: "Namespace SIGNAL, Code 11"
      )

      let log = report.toLogRecord()
      let attributes = try #require(log.attributes?.value as? [String: Any])

      #expect(log.name == "native.exception")
      #expect(log.severity == .fatal)
      #expect(log.timestamp == timestampEnd.ISO8601Format())
      #expect(attributes["exception.type"] as? String == "EXC_BAD_ACCESS")
      #expect(attributes["exception.message"] as? String == "Namespace SIGNAL, Code 11")
      #expect(attributes["expo.error.source"] as? String == "nativeCrash")
      #expect(attributes["expo.error.is_fatal"] as? Bool == true)
      #expect(attributes["expo.crash.exception_type"] as? String == "EXC_BAD_ACCESS")
      #expect(attributes["expo.crash.exception_type_code"] as? Int == 1)
      #expect(attributes["expo.crash.exception_code"] as? Int == 2)
      #expect(attributes["expo.crash.signal"] as? String == "SIGSEGV")
      #expect(attributes["expo.crash.signal_number"] as? Int == 11)
      #expect(attributes["expo.crash.termination_reason"] as? String == "Namespace SIGNAL, Code 11")
    }

    @Test
    func `uses Objective-C exception details`() throws {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        terminationReason: "Application Specific Information",
        exceptionReason: CrashReport.ExceptionReason(
          composedMessage: "-[NSNull length]: unrecognized selector",
          formatString: "%@: unrecognized selector",
          arguments: ["-[NSNull length]"],
          exceptionType: "NSInvalidArgumentException",
          className: "NSException",
          exceptionName: "NSInvalidArgumentException"
        )
      )

      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["exception.type"] as? String == "NSInvalidArgumentException")
      #expect(
        attributes["exception.message"] as? String
          == "Application Specific Information\n-[NSNull length]: unrecognized selector"
      )
      #expect(attributes["expo.crash.objc_exception_type"] as? String == "NSInvalidArgumentException")
      #expect(
        attributes["expo.crash.objc_exception_message"] as? String == "-[NSNull length]: unrecognized selector"
      )
    }

    @Test
    func `describes how the trace was built`() throws {
      let attributedFrames = (0..<53).map { index in
        CrashReport.CallStackTree.Frame(
          binaryName: "TestApp",
          binaryUUID: "9F0C0F7E-1E55-4B0E-9C6E-1D6E6F0C0F7E",
          address: nil,
          offsetIntoBinaryTextSegment: UInt64(index),
          sampleCount: nil,
          subFrames: nil,
          symbol: "frame\(index)"
        )
      }
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        callStackTree: CrashReport.CallStackTree(callStacks: [
          CrashReport.CallStackTree.CallStack(
            threadAttributed: true,
            callStackRootFrames: attributedFrames
          ),
          CrashReport.CallStackTree.CallStack(
            threadAttributed: false,
            callStackRootFrames: [
              CrashReport.CallStackTree.Frame(
                binaryName: "Other",
                binaryUUID: "11111111-1111-1111-1111-111111111111",
                address: nil,
                offsetIntoBinaryTextSegment: 0,
                sampleCount: nil,
                subFrames: nil,
                symbol: "unattributed"
              )
            ]
          ),
        ])
      )
      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["expo.crash.thread_count"] as? Int == 2)
      #expect(attributes["expo.crash.thread_attributed"] as? Bool == true)
      #expect(attributes["expo.crash.rendered_frame_count"] as? Int == 50)
      #expect(attributes["expo.crash.total_frame_count"] as? Int == 53)
      // Only the binaries actually rendered, so the unattributed thread's is absent.
      #expect(
        attributes["expo.crash.binary_uuids"] as? [String]
          == ["TestApp:9F0C0F7E-1E55-4B0E-9C6E-1D6E6F0C0F7E"]
      )
    }

    @Test
    func `reports no thread as attributed when MetricKit flags none`() throws {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        callStackTree: CrashReport.CallStackTree(callStacks: [
          CrashReport.CallStackTree.CallStack(
            threadAttributed: false,
            callStackRootFrames: [
              CrashReport.CallStackTree.Frame(
                binaryName: "TestApp",
                binaryUUID: nil,
                address: nil,
                offsetIntoBinaryTextSegment: 128,
                sampleCount: nil,
                subFrames: nil,
                symbol: nil
              )
            ]
          )
        ])
      )
      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["expo.crash.thread_attributed"] as? Bool == false)
      #expect(attributes["expo.crash.thread_count"] as? Int == 1)
      // No UUID on the frame, so the attribute is left off rather than emitted empty.
      #expect(attributes["expo.crash.binary_uuids"] == nil)
      // Nothing to name it with, so the trace keeps the address on its own.
      let stacktrace = try #require(attributes["exception.stacktrace"] as? String)
      #expect(stacktrace == "TestApp + 128")
    }

    @Test
    func `reports the faulting memory region`() throws {
      // A stack overflow looks like any other bad access until you check the region.
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        virtualMemoryRegionInfo: "0x16f603ff8 is in STACK GUARD region"
      )
      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(
        attributes["expo.crash.virtual_memory_region"] as? String
          == "0x16f603ff8 is in STACK GUARD region"
      )
    }

    @Test
    func `renders at most fifty attributed stack frames and reports the omitted count`() throws {
      let attributedFrames = (0..<53).map { index in
        CrashReport.CallStackTree.Frame(
          binaryName: "TestApp",
          binaryUUID: nil,
          address: nil,
          offsetIntoBinaryTextSegment: nil,
          sampleCount: nil,
          subFrames: nil,
          symbol: "frame\(index)"
        )
      }
      let unattributedFrame = CrashReport.CallStackTree.Frame(
        binaryName: "TestApp",
        binaryUUID: nil,
        address: nil,
        offsetIntoBinaryTextSegment: nil,
        sampleCount: nil,
        subFrames: nil,
        symbol: "unattributed"
      )
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        callStackTree: CrashReport.CallStackTree(callStacks: [
          CrashReport.CallStackTree.CallStack(
            threadAttributed: true,
            callStackRootFrames: attributedFrames
          ),
          CrashReport.CallStackTree.CallStack(
            threadAttributed: false,
            callStackRootFrames: [unattributedFrame]
          ),
        ])
      )

      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      let stacktrace = try #require(attributes["exception.stacktrace"] as? String)
      let lines = stacktrace.split(separator: "\n")
      #expect(lines.count == 51)
      // These fixtures carry no offset or address, so there's nothing to append to the symbol.
      #expect(lines.first == "frame0")
      #expect(lines[49] == "frame49")
      #expect(lines.last == "… +3 more frames")
      #expect(!stacktrace.contains("unattributed"))
    }
  }

}

private let testDevice = DeviceInfo(
  modelName: "iPhone",
  modelIdentifier: "iPhone16,1",
  systemName: "iOS",
  systemVersion: "18.0"
)

private func makeAppInfo(buildNumber: String) -> AppInfo {
  return AppInfo(
    appId: "dev.expo.test",
    appName: "TestApp",
    appVersion: "1.0.0",
    buildNumber: buildNumber,
    updatesInfo: nil
  )
}

private func makeBuildSessionRow(buildNumber: String, startTimestamp: String, expoSdkVersion: String) -> SessionRow {
  return SessionRow(
    id: UUID().uuidString,
    type: Session.SessionType.main.rawValue,
    startTimestamp: startTimestamp,
    isActive: false,
    appVersion: "1.0.0",
    appBuildNumber: buildNumber,
    appEasBuildId: "eas-build-\(buildNumber)",
    expoSdkVersion: expoSdkVersion,
    reactNativeVersion: "0.86.0"
  )
}

@AppMetricsActor
private func withTemporaryDatabase(_ body: (MetricsDatabase) throws -> Void) throws {
  let directoryUrl = FileManager.default.temporaryDirectory
    .appendingPathComponent("CrashReportTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
  defer {
    try? FileManager.default.removeItem(at: directoryUrl)
  }
  try body(try MetricsDatabase(directoryUrl: directoryUrl))
}

private func makeMainSessionRow(id: String, startDate: Date, endDate: Date?, processId: Int? = nil) -> SessionRow {
  return SessionRow(
    id: id,
    type: Session.SessionType.main.rawValue,
    startTimestamp: startDate.ISO8601Format(),
    endTimestamp: endDate?.ISO8601Format(),
    isActive: endDate == nil,
    processId: processId
  )
}

private func makeCrashReport(
  timestampBegin: Date,
  timestampEnd: Date,
  ingestedAt: Date = Date.now,
  exceptionType: Int? = 1,
  exceptionCode: Int? = 1,
  signal: Int? = 11,
  terminationReason: String? = nil,
  virtualMemoryRegionInfo: String? = nil,
  exceptionReason: CrashReport.ExceptionReason? = nil,
  callStackTree: CrashReport.CallStackTree? = nil,
  appBuildNumber: String? = nil,
  osVersion: String? = nil,
  processId: Int? = nil
) -> CrashReport {
  return CrashReport(
    exceptionType: exceptionType,
    exceptionCode: exceptionCode,
    signal: signal,
    terminationReason: terminationReason,
    virtualMemoryRegionInfo: virtualMemoryRegionInfo,
    exceptionReason: exceptionReason,
    callStackTree: callStackTree,
    appVersion: "1.0.0",
    appBuildNumber: appBuildNumber,
    osVersion: osVersion,
    processId: processId,
    timestampBegin: timestampBegin,
    timestampEnd: timestampEnd,
    ingestedAt: ingestedAt
  )
}
