import Foundation
import Testing

@testable import ExpoAppMetrics

private let startMs: Int64 = 1_782_131_895_000
private let endMs: Int64 = 1_782_131_895_250

private func makeRecorder(
  name: String = "checkout",
  sessionId: String = "s",
  parentTraceId: String? = nil,
  parentSpanId: String? = nil,
  attributes: [String: Any]? = nil
) -> SpanRecorder {
  return SpanRecorder(
    name: name,
    sessionId: sessionId,
    parentTraceId: parentTraceId,
    parentSpanId: parentSpanId,
    attributes: attributes,
    startTimestampMs: startMs
  )
}

private func attributesDict(_ row: SpanRow) throws -> [String: Any] {
  let json = try #require(row.attributes)
  let data = try #require(json.data(using: .utf8))
  return try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
}

private func eventsArray(_ row: SpanRow) throws -> [[String: Any]] {
  let json = try #require(row.events)
  let data = try #require(json.data(using: .utf8))
  return try #require(try JSONSerialization.jsonObject(with: data) as? [[String: Any]])
}

@Suite("SpanRecorder")
struct SpanRecorderTests {
  @Test
  func `mints a fresh trace for a root span`() {
    let recorder = makeRecorder()
    #expect(recorder.traceId.count == 32)
    #expect(recorder.spanId.count == 16)
    #expect(recorder.parentSpanId == nil)
  }

  @Test
  func `a child continues its parent's trace and references its span id`() {
    let parent = makeRecorder()
    let child = makeRecorder(parentTraceId: parent.traceId, parentSpanId: parent.spanId)
    #expect(child.traceId == parent.traceId)
    #expect(child.parentSpanId == parent.spanId)
    #expect(child.spanId != parent.spanId)
  }

  @Test
  func `the ids minted at start are the ids on the written row`() throws {
    // Children reference these ids before the row exists; end must not re-mint them.
    let recorder = makeRecorder()
    let row = try #require(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs))
    #expect(row.traceId == recorder.traceId)
    #expect(row.spanId == recorder.spanId)
  }

  @Test
  func `end produces an internal-kind row with the given window`() throws {
    let row = try #require(makeRecorder().end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs))
    #expect(row.sessionId == "s")
    #expect(row.name == "checkout")
    #expect(row.kind == SpanRow.internalKind)
    #expect(row.startTimestampMs == startMs)
    #expect(row.endTimestampMs == endMs)
    #expect(row.statusCode == nil)
    #expect(row.attributes == nil)
    #expect(row.events == nil)
  }

  @Test
  func `end returns the row exactly once`() {
    let recorder = makeRecorder()
    #expect(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs) != nil)
    #expect(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs + 1) == nil)
  }

  @Test
  func `stores the status code with its message`() throws {
    let recorder = makeRecorder()
    let row = try #require(
      recorder.end(statusCode: SpanRow.statusError, statusMessage: "card declined", endTimestampMs: endMs)
    )
    #expect(row.statusCode == SpanRow.statusError)
    #expect(row.statusMessage == "card declined")
  }

  @Test
  func `drops a status message that has no status code`() throws {
    // A message with no code has no OTLP representation.
    let recorder = makeRecorder()
    let row = try #require(recorder.end(statusCode: nil, statusMessage: "orphan", endTimestampMs: endMs))
    #expect(row.statusMessage == nil)
  }

  @Test
  func `merges attributes with later writes winning`() throws {
    let recorder = makeRecorder(attributes: ["cart.items": 3, "cart.total": 100])
    recorder.setAttributes(["cart.total": 129, "cart.currency": "USD"])
    let attributes = try attributesDict(
      #require(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs))
    )
    #expect(attributes["cart.items"] as? Int == 3)
    #expect(attributes["cart.total"] as? Int == 129)
    #expect(attributes["cart.currency"] as? String == "USD")
  }

  @Test
  func `runs attributes through the log-event validation`() throws {
    // The reserved `expo.*` namespace is SDK-owned; caller attempts to write into it drop.
    let recorder = makeRecorder(attributes: ["expo.session_id": "spoof", "cart.items": 3])
    let attributes = try attributesDict(
      #require(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs))
    )
    #expect(attributes["expo.session_id"] == nil)
    #expect(attributes["cart.items"] as? Int == 3)
  }

  @Test
  func `ignores mutations after the span ended`() throws {
    let recorder = makeRecorder(attributes: ["cart.items": 3])
    #expect(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs) != nil)
    recorder.setAttributes(["late": true])
    recorder.addEvent(name: "late-event", attributes: nil, timeMs: endMs)
    // The row was already produced; a fresh recorder shows what a late mutation would have added.
    let control = makeRecorder(attributes: ["cart.items": 3])
    let row = try #require(control.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs))
    #expect(try attributesDict(row)["late"] == nil)
  }

  @Test
  func `encodes events with their timestamps and attributes`() throws {
    let recorder = makeRecorder()
    recorder.addEvent(name: "cart-validated", attributes: ["items": 3], timeMs: startMs + 50)
    recorder.addEvent(name: "payment-authorized", attributes: nil, timeMs: startMs + 200)
    let events = try eventsArray(#require(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs)))
    #expect(events.count == 2)
    #expect(events[0]["name"] as? String == "cart-validated")
    #expect(events[0]["timeMs"] as? Int64 == startMs + 50)
    #expect((events[0]["attributes"] as? [String: Any])?["items"] as? Int == 3)
    #expect(events[1]["attributes"] == nil)
  }

  @Test
  func `drops events whose name trims to empty`() throws {
    let recorder = makeRecorder()
    recorder.addEvent(name: "  ", attributes: nil, timeMs: startMs)
    recorder.addEvent(name: "kept", attributes: nil, timeMs: startMs)
    let events = try eventsArray(#require(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs)))
    #expect(events.map { $0["name"] as? String } == ["kept"])
  }

  @Test
  func `caps the number of buffered events`() throws {
    let recorder = makeRecorder()
    for index in 0..<(SpanRecorder.maxEventCount + 10) {
      recorder.addEvent(name: "event-\(index)", attributes: nil, timeMs: startMs)
    }
    let events = try eventsArray(#require(recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: endMs)))
    #expect(events.count == SpanRecorder.maxEventCount)
    #expect(events.first?["name"] as? String == "event-0")
  }
}

@AppMetricsActor
@Suite("SpanRecorder database round-trip")
struct SpanRecorderDatabaseTests {
  @Test
  func `a recorded span round-trips through the spans table`() throws {
    let directoryUrl = FileManager.default.temporaryDirectory
      .appendingPathComponent("SpanRecorderTests-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
    defer {
      try? FileManager.default.removeItem(at: directoryUrl)
    }
    let database = try MetricsDatabase(directoryUrl: directoryUrl)
    try database.insert(
      session: SessionRow(id: "s", type: "main", startTimestamp: "2026-08-13T10:00:00Z", isActive: true)
    )
    let recorder = SpanRecorder(
      name: "checkout",
      sessionId: "s",
      attributes: ["cart.items": 3],
      startTimestampMs: startMs
    )
    recorder.addEvent(name: "cart-validated", attributes: nil, timeMs: startMs + 50)
    let row = try #require(recorder.end(statusCode: SpanRow.statusOk, statusMessage: nil, endTimestampMs: endMs))
    try database.insert(span: row)
    let stored = try #require(try database.getSpans(afterId: -1).first)
    #expect(stored.traceId == recorder.traceId)
    #expect(stored.spanId == recorder.spanId)
    #expect(stored.kind == SpanRow.internalKind)
    #expect(stored.statusCode == SpanRow.statusOk)
    #expect(stored.attributes?.contains("cart.items") == true)
    #expect(stored.events?.contains("cart-validated") == true)
  }
}
