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

private func makeCrashReport(timestampBegin: Date, timestampEnd: Date) -> CrashReport {
  return CrashReport(
    exceptionType: 1,
    exceptionCode: 1,
    signal: 11,
    terminationReason: nil,
    virtualMemoryRegionInfo: nil,
    exceptionReason: nil,
    callStackTree: nil,
    appVersion: "1.0.0",
    timestampBegin: timestampBegin,
    timestampEnd: timestampEnd,
    ingestedAt: Date.now
  )
}
