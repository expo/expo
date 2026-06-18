import Testing

@testable import ExpoAppMetrics

@Suite("makeLogRecord + receiveLog")
struct SessionLogEventTests {
  // MARK: - makeLogRecord (free function: validation + record building)
  //
  // Mirrors Android, where validation and record building live outside the session object. The
  // session class only persists (`receiveLog`), so the building responsibility is tested here.

  @Test
  func `builds a record from a valid name and options`() {
    let options = LogEventOptions()
    options.body = "everything is fine"
    options.severity = .error

    let record = makeLogRecord(name: "auth.login_failed", options: options)
    #expect(record?.name == "auth.login_failed")
    #expect(record?.body == "everything is fine")
    #expect(record?.severity == .error)
    #expect(record?.droppedAttributesCount == 0)
  }

  @Test
  func `defaults severity to info when options are omitted`() {
    let record = makeLogRecord(name: "user.signed_in", options: nil)
    #expect(record?.severity == .info)
  }

  @Test
  func `defaults severity to info when options omit severity`() {
    // Distinct from the `options: nil` case: options are present but `severity` is left unset, so
    // the `?? .info` fallback still has to fire.
    let options = LogEventOptions()
    options.body = "no severity provided"

    let record = makeLogRecord(name: "user.signed_in", options: options)
    #expect(record?.severity == .info)
  }

  @Test
  func `trims the event name`() {
    let record = makeLogRecord(name: "  user.signed_in\n", options: nil)
    #expect(record?.name == "user.signed_in")
  }

  @Test
  func `drops events whose name is invalid`() {
    // Empty and reserved-prefix names are rejected by `validateEventName`, so no record is produced.
    #expect(makeLogRecord(name: "", options: nil) == nil)
    #expect(makeLogRecord(name: "expo.reserved", options: nil) == nil)
  }

  @Test
  func `keeps valid attributes and drops reserved ones, reporting the dropped count`() {
    let options = LogEventOptions()
    options.attributes = [
      "valid": "kept",
      "expo.app.name": "reserved-namespace",
      "session.id": "reserved-key"
    ]

    let record = makeLogRecord(name: "checkout.completed", options: options)
    let attributes = record?.attributes?.value as? [String: Any]
    // The valid attribute survives with its value intact; the two reserved keys are dropped.
    #expect(attributes?["valid"] as? String == "kept")
    #expect(attributes?["expo.app.name"] == nil)
    #expect(attributes?["session.id"] == nil)
    #expect(record?.droppedAttributesCount == 2)
  }

  @Test
  func `leaves attributes nil when every entry is dropped`() {
    let options = LogEventOptions()
    options.attributes = ["expo.only": "reserved"]

    let record = makeLogRecord(name: "checkout.completed", options: options)
    #expect(record?.attributes == nil)
    #expect(record?.droppedAttributesCount == 1)
  }

  @Test
  func `truncates an over-long body`() {
    let options = LogEventOptions()
    options.body = String(repeating: "a", count: 5000)

    let record = makeLogRecord(name: "verbose.event", options: options)
    // `validateEventBody` caps the body at 4096 characters, ellipsis included.
    #expect(record?.body?.count == 4096)
    #expect(record?.body?.hasSuffix("…") == true)
  }

  // MARK: - receiveLog (the session's only logging responsibility: persist under its own id)

  @Test
  func `persists a built log against the session's own id`() async throws {
    // The session keys the log to its own id via `receiveLog`, never an id passed in. Build the
    // record outside the session (as the module does), persist it through the session handle, then
    // read it back. `getLogs` filters by the session's unique id, so this is isolated from any other
    // rows in the shared database.
    let session = ForegroundSession()
    let record = try #require(makeLogRecord(name: "checkout.completed", options: nil))

    // One actor hop drains the session-row INSERT enqueued in `init` (FIFO on the actor) before we
    // write and read the log, so the foreign-key dependency is satisfied.
    let logNames = try await AppMetricsActor.isolated {
      session.receiveLog(record)
      return try session.getLogs().map(\.name)
    }.value

    #expect(logNames.contains("checkout.completed"))
  }
}
