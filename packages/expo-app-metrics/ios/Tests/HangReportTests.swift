import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("HangReport")
struct HangReportTests {
  @AppMetricsActor
  @Suite("findMatchingSession")
  struct FindMatchingSessionTests {
    @Test
    func `matches the session of the hung process`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)
      let hung = makeMainSessionRow(id: "hung", startDate: windowStart, endDate: nil, processId: 100)
      let other = makeMainSessionRow(id: "other", startDate: windowStart, endDate: nil, processId: 200)

      let report = makeHangReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: 100)
      #expect(report.findMatchingSession(in: [other, hung])?.id == "hung")
    }

    @Test
    func `matches the only session in the window when the process is unknown`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)
      let session = makeMainSessionRow(
        id: "only",
        startDate: windowStart.addingTimeInterval(60),
        endDate: windowEnd.addingTimeInterval(-60)
      )

      let report = makeHangReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      #expect(report.findMatchingSession(in: [session])?.id == "only")
    }

    @Test
    func `matches nothing when the process is unknown and several sessions are in the window`() {
      let windowEnd = Date.now
      let windowStart = windowEnd.addingTimeInterval(-3600)
      let finished = makeMainSessionRow(
        id: "finished",
        startDate: windowStart.addingTimeInterval(60),
        endDate: windowStart.addingTimeInterval(120)
      )
      let unfinished = makeMainSessionRow(id: "unfinished", startDate: windowStart.addingTimeInterval(300), endDate: nil)

      let report = makeHangReport(timestampBegin: windowStart, timestampEnd: windowEnd)
      #expect(report.findMatchingSession(in: [finished, unfinished]) == nil)
    }
  }

  @Suite("toLogRecord")
  struct ToLogRecordTests {
    @Test
    func `builds an error exception log with the hang duration`() throws {
      let windowEnd = Date.now
      let report = makeHangReport(
        timestampBegin: windowEnd.addingTimeInterval(-3600),
        timestampEnd: windowEnd,
        hangDuration: 2.5
      )

      let record = report.toLogRecord()
      let attributes = try #require(record.attributes?.value as? [String: Any])
      #expect(record.name == nativeExceptionLogName)
      #expect(record.severity == .error)
      #expect(record.timestamp == windowEnd.ISO8601Format())
      #expect(attributes["exception.type"] as? String == "AppHang")
      #expect(attributes["exception.message"] as? String == "The app did not respond")
      #expect(attributes["expo.error.source"] as? String == "appHang")
      #expect(attributes["expo.error.is_fatal"] as? Bool == false)
      #expect(attributes["expo.hang.duration_ms"] as? Int == 2500)
    }

    @Test
    func `renders only the attributed thread`() throws {
      let report = makeHangReport(callStackTree: makeTree([(false, "background"), (true, "hung")]))

      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["exception.stacktrace"] as? String == "hung")
    }

    @Test
    func `renders only the first thread when no thread is attributed`() throws {
      let report = makeHangReport(callStackTree: makeTree([(nil, "first"), (nil, "second")]))

      let attributes = try #require(report.toLogRecord().attributes?.value as? [String: Any])
      #expect(attributes["exception.stacktrace"] as? String == "first")
    }
  }

  #if !os(tvOS)
  @AppMetricsActor
  @Suite("storeHangReports")
  struct StoreHangReportsTests {
    @Test
    func `stores every hang of a payload once when the payload is delivered twice`() throws {
      try withTemporaryDatabase { database in
        let windowEnd = Date.now.addingTimeInterval(-60)
        let windowStart = windowEnd.addingTimeInterval(-3600)
        try database.insert(session: makeMainSessionRow(id: "hung", startDate: windowStart, endDate: nil, processId: 100))
        let reports = [
          makeHangReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: 100),
          makeHangReport(timestampBegin: windowStart, timestampEnd: windowEnd, processId: 100),
        ]

        let cursor = MetricKitSubscriber.storeHangReports(reports, in: database, after: nil)
        let secondCursor = MetricKitSubscriber.storeHangReports(reports, in: database, after: cursor)

        #expect(cursor == windowEnd)
        #expect(secondCursor == windowEnd)
        #expect(try database.getLogs(sessionId: "hung").count == 2)
      }
    }

    @Test
    func `drops a hang that matches no session`() throws {
      try withTemporaryDatabase { database in
        let windowEnd = Date.now.addingTimeInterval(-60)
        let report = makeHangReport(
          timestampBegin: windowEnd.addingTimeInterval(-3600),
          timestampEnd: windowEnd,
          processId: 100
        )

        let cursor = MetricKitSubscriber.storeHangReports([report], in: database, after: nil)

        #expect(cursor == windowEnd)
        let logs = try database.getLogs(afterId: 0)
        #expect(logs.isEmpty)
      }
    }
  }
  #endif
}

private func makeTree(_ threads: [(attributed: Bool?, symbol: String)]) -> CrashReport.CallStackTree {
  return CrashReport.CallStackTree(callStacks: threads.map { thread in
    CrashReport.CallStackTree.CallStack(
      threadAttributed: thread.attributed,
      callStackRootFrames: [
        CrashReport.CallStackTree.Frame(
          binaryName: nil,
          binaryUUID: nil,
          address: nil,
          offsetIntoBinaryTextSegment: nil,
          sampleCount: nil,
          subFrames: nil,
          symbol: thread.symbol
        ),
      ]
    )
  })
}

private func makeHangReport(
  timestampBegin: Date = Date.now,
  timestampEnd: Date = Date.now,
  hangDuration: TimeInterval = 1,
  processId: Int? = nil,
  callStackTree: CrashReport.CallStackTree? = nil
) -> HangReport {
  return HangReport(
    hangDuration: hangDuration,
    callStackTree: callStackTree,
    processId: processId,
    timestampBegin: timestampBegin,
    timestampEnd: timestampEnd
  )
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

@AppMetricsActor
private func withTemporaryDatabase(_ body: (MetricsDatabase) throws -> Void) throws {
  let directoryUrl = FileManager.default.temporaryDirectory
    .appendingPathComponent("HangReportTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
  defer {
    try? FileManager.default.removeItem(at: directoryUrl)
  }
  try body(try MetricsDatabase(directoryUrl: directoryUrl))
}
