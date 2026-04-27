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

      let unfinished = MainSession(
        id: "unfinished",
        startDate: windowEnd.addingTimeInterval(-1800),
        endDate: nil
      )
      let finished = MainSession(
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

      let earlier = MainSession(
        id: "earlier",
        startDate: windowEnd.addingTimeInterval(-2400),
        endDate: nil
      )
      let later = MainSession(
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

      let earlier = MainSession(
        id: "earlier",
        startDate: windowEnd.addingTimeInterval(-2400),
        endDate: windowEnd.addingTimeInterval(-2000)
      )
      let later = MainSession(
        id: "later",
        startDate: windowEnd.addingTimeInterval(-1200),
        endDate: windowEnd.addingTimeInterval(-600)
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [earlier, later])
      #expect(match?.id == "later")
    }

    @Test
    func `returns nil when no session is in the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)

      let beforeWindow = MainSession(
        id: "before",
        startDate: windowStart.addingTimeInterval(-1000),
        endDate: nil
      )
      let afterWindow = MainSession(
        id: "after",
        startDate: windowEnd.addingTimeInterval(1000),
        endDate: nil
      )

      let report = makeCrashReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      let match = report.findMatchingSession(in: [beforeWindow, afterWindow])
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
