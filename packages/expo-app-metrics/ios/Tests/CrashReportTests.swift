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

  @AppMetricsActor
  @Suite("eventAttributes")
  struct EventAttributesTests {
    @Test
    func `surfaces exception and signal codes as both raw value and name`() {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        exceptionType: 1,
        exceptionCode: 2,
        signal: 11
      )
      let attributes = report.eventAttributes

      #expect(attributes["expo.crash.exception_type"] as? String == "EXC_BAD_ACCESS")
      #expect(attributes["expo.crash.exception_type_code"] as? Int == 1)
      #expect(attributes["expo.crash.exception_code"] as? Int == 2)
      #expect(attributes["expo.crash.signal"] as? String == "SIGSEGV")
      #expect(attributes["expo.crash.signal_code"] as? Int == 11)
      #expect(attributes["expo.app.version"] as? String == "1.0.0")
    }

    @Test
    func `omits absent optional fields`() {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        exceptionType: nil,
        exceptionCode: nil,
        signal: nil
      )
      let attributes = report.eventAttributes

      #expect(attributes["expo.crash.exception_type"] == nil)
      #expect(attributes["expo.crash.exception_code"] == nil)
      #expect(attributes["expo.crash.signal"] == nil)
      #expect(attributes["expo.crash.termination_reason"] == nil)
      #expect(attributes["expo.crash.objc_exception_type"] == nil)
      // App version is always present.
      #expect(attributes["expo.app.version"] as? String == "1.0.0")
    }

    @Test
    func `includes termination reason and ObjC exception details when present`() {
      let report = makeCrashReport(
        timestampBegin: Date.now,
        timestampEnd: Date.now,
        terminationReason: "Namespace SIGNAL, Code 11",
        exceptionReason: CrashReport.ExceptionReason(
          composedMessage: "-[NSNull length]: unrecognized selector",
          formatString: "%@: unrecognized selector",
          arguments: ["-[NSNull length]"],
          exceptionType: "NSInvalidArgumentException",
          className: "NSException",
          exceptionName: "NSInvalidArgumentException"
        )
      )
      let attributes = report.eventAttributes

      #expect(attributes["expo.crash.termination_reason"] as? String == "Namespace SIGNAL, Code 11")
      #expect(attributes["expo.crash.objc_exception_type"] as? String == "NSInvalidArgumentException")
      #expect(attributes["expo.crash.objc_exception_message"] as? String == "-[NSNull length]: unrecognized selector")
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
  exceptionType: Int? = 1,
  exceptionCode: Int? = 1,
  signal: Int? = 11,
  terminationReason: String? = nil,
  exceptionReason: CrashReport.ExceptionReason? = nil
) -> CrashReport {
  return CrashReport(
    exceptionType: exceptionType,
    exceptionCode: exceptionCode,
    signal: signal,
    terminationReason: terminationReason,
    virtualMemoryRegionInfo: nil,
    exceptionReason: exceptionReason,
    callStackTree: nil,
    appVersion: "1.0.0",
    timestampBegin: timestampBegin.ISO8601Format(),
    timestampEnd: timestampEnd.ISO8601Format(),
    ingestedAt: Date.now.ISO8601Format()
  )
}
