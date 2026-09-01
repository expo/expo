import Testing

@testable import ExpoAppMetrics

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
    func `renders at most twenty-five attributed stack frames and reports the omitted count`() throws {
      let attributedFrames = (0..<28).map { index in
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
      #expect(lines.count == 26)
      #expect(lines.first == "frame0")
      #expect(lines[24] == "frame24")
      #expect(lines.last == "… +3 more frames")
      #expect(!stacktrace.contains("unattributed"))
    }
  }
}

private func makeMainSessionRow(id: String, startDate: Date, endDate: Date?) -> SessionRow {
  return SessionRow(
    id: id,
    type: Session.SessionType.main.rawValue,
    startTimestamp: startDate.ISO8601Format(),
    endTimestamp: endDate?.ISO8601Format(),
    isActive: endDate == nil
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
  exceptionReason: CrashReport.ExceptionReason? = nil,
  callStackTree: CrashReport.CallStackTree? = nil
) -> CrashReport {
  return CrashReport(
    exceptionType: exceptionType,
    exceptionCode: exceptionCode,
    signal: signal,
    terminationReason: terminationReason,
    virtualMemoryRegionInfo: nil,
    exceptionReason: exceptionReason,
    callStackTree: callStackTree,
    appVersion: "1.0.0",
    timestampBegin: timestampBegin,
    timestampEnd: timestampEnd,
    ingestedAt: ingestedAt
  )
}
