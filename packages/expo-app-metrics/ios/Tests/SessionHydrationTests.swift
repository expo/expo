import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("SessionRow.toSession")
struct SessionHydrationTests {
  @Test
  func `hydrates id, type and timestamps from a row`() throws {
    let row = makeRow(
      id: "session-1",
      type: "main",
      startTimestamp: "2026-05-07T12:00:00Z",
      endTimestamp: "2026-05-07T12:30:00Z"
    )
    let session = row.toSession()

    #expect(session.id == "session-1")
    #expect(session.type == .main)
    #expect(session.startDate.ISO8601Format() == "2026-05-07T12:00:00Z")
    #expect(session.endDate?.ISO8601Format() == "2026-05-07T12:30:00Z")
    #expect(session.isActive == false)
  }

  @Test
  func `timestamps written with ISO8601Format round-trip losslessly`() throws {
    // All timestamps this package persists are produced by `Date.ISO8601Format()`
    // (second granularity), so hydration must reproduce the exact same string.
    let startDate = Date(timeIntervalSince1970: 1_777_777_777)
    let row = makeRow(id: "session-2", startTimestamp: startDate.ISO8601Format())
    let session = row.toSession()

    #expect(session.startDate == startDate)
    #expect(session.startDate.ISO8601Format() == startDate.ISO8601Format())
  }

  @Test
  func `falls back to unknown for an unrecognized type string`() throws {
    let session = makeRow(id: "session-3", type: "not-a-real-type").toSession()
    #expect(session.type == .unknown)
  }

  @Test
  func `falls back to the epoch for an unparseable start timestamp`() throws {
    for garbage in ["", "yesterday", "2026-13-99T99:99:99Z"] {
      let session = makeRow(id: "session-4", startTimestamp: garbage).toSession()
      #expect(session.startDate == Date(timeIntervalSince1970: 0))
    }
  }

  @Test
  func `keeps endDate nil for a still-active row`() throws {
    let session = makeRow(id: "session-5", endTimestamp: nil).toSession()
    #expect(session.endDate == nil)
    #expect(session.isActive == true)
  }

  @Test
  func `drops an unparseable end timestamp instead of inventing one`() throws {
    let session = makeRow(id: "session-6", endTimestamp: "garbage").toSession()
    #expect(session.endDate == nil)
  }

  @Test
  func `SessionRef wraps the exact session instance and reports its ref type`() throws {
    let session = makeRow(id: "session-7").toSession()
    let ref = SessionRef(session, hasCrashReport: true)
    #expect(ref.ref === session)
    #expect(ref.hasCrashReport == true)
    #expect(ref.nativeRefType == "session")
  }
}

private func makeRow(
  id: String,
  type: String = "main",
  startTimestamp: String = "2026-05-07T12:00:00Z",
  endTimestamp: String? = nil
) -> SessionRow {
  return SessionRow(
    id: id,
    type: type,
    startTimestamp: startTimestamp,
    endTimestamp: endTimestamp,
    isActive: endTimestamp == nil
  )
}
