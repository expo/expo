import Testing

@testable import ExpoAppMetrics
@testable import ExpoObserve

@AppMetricsActor
@Suite("repairCursorIfStale")
struct CursorRepairTests {
  @Test
  func `cursor below max id is left alone`() {
    var stored: Int64 = 5
    repairCursorIfStale(
      signalName: "metric",
      readCursor: { stored },
      writeCursor: { stored = $0 },
      readMaxId: { 10 }
    )
    #expect(stored == 5)
  }

  @Test
  func `cursor equal to max id is left alone`() {
    var stored: Int64 = 10
    repairCursorIfStale(
      signalName: "metric",
      readCursor: { stored },
      writeCursor: { stored = $0 },
      readMaxId: { 10 }
    )
    #expect(stored == 10)
  }

  @Test
  func `cursor above max id is reset to -1`() {
    var stored: Int64 = 42
    repairCursorIfStale(
      signalName: "metric",
      readCursor: { stored },
      writeCursor: { stored = $0 },
      readMaxId: { 10 }
    )
    #expect(stored == -1)
  }

  @Test
  func `non-default cursor with empty table is reset to -1`() {
    // Captures the wipe scenario: cursor advanced from prior runs but the table has been
    // recreated empty (e.g. schema-version mismatch wipe).
    var stored: Int64 = 42
    repairCursorIfStale(
      signalName: "metric",
      readCursor: { stored },
      writeCursor: { stored = $0 },
      readMaxId: { nil }
    )
    #expect(stored == -1)
  }

  @Test
  func `default cursor with empty table is left alone`() {
    // Fresh install: cursor never moved, table is naturally empty. The repair must not "reset"
    // the already-default value, otherwise it would always log a no-op write.
    var writeCalled = false
    var stored: Int64 = -1
    repairCursorIfStale(
      signalName: "metric",
      readCursor: { stored },
      writeCursor: { stored = $0; writeCalled = true },
      readMaxId: { nil }
    )
    #expect(stored == -1)
    #expect(writeCalled == false)
  }

  @Test
  func `readMaxId throwing leaves cursor alone`() {
    // A transient read failure must not falsely advertise the cursor as stale. Better to keep the
    // cursor and skip the dispatch round than to silently rewind it because the lookup failed.
    var writeCalled = false
    var stored: Int64 = 42
    repairCursorIfStale(
      signalName: "metric",
      readCursor: { stored },
      writeCursor: { stored = $0; writeCalled = true },
      readMaxId: { throw CursorRepairTestsError.boom }
    )
    #expect(stored == 42)
    #expect(writeCalled == false)
  }
}

private enum CursorRepairTestsError: Error {
  case boom
}
