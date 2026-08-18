import ExpoAppMetrics
import Foundation
import Testing

@testable import ExpoObserve

/// Fixed span window used across these tests: 250 ms starting at a whole second, so the
/// nanosecond expectations stay readable.
private let startMs: Int64 = 1_782_131_895_000
private let endMs: Int64 = 1_782_131_895_250

private func makeRow(
  sessionId: String = "0f8fad5b-d9cb-469f-a165-70867728950e",
  traceId: String = "a3ce929d0e0e4736a3ce929d0e0e4736",
  spanId: String = "00f067aa0ba902b7",
  parentSpanId: String? = nil,
  name: String = "GET",
  kind: Int = SpanRow.clientKind,
  startTimestampMs: Int64 = startMs,
  endTimestampMs: Int64 = endMs,
  statusCode: Int? = nil,
  statusMessage: String? = nil,
  attributes: String? = nil,
  events: String? = nil
) -> SpanRow {
  return SpanRow(
    sessionId: sessionId,
    traceId: traceId,
    spanId: spanId,
    parentSpanId: parentSpanId,
    name: name,
    kind: kind,
    startTimestampMs: startTimestampMs,
    endTimestampMs: endTimestampMs,
    statusCode: statusCode,
    statusMessage: statusMessage,
    attributes: attributes,
    events: events
  )
}

/// Looks up a span attribute by key, returning `nil` when absent.
private func attribute(_ span: OTSpan, _ key: String) -> OTAnyValue? {
  return span.attributes.first { $0.key == key }?.value
}

private func stringAttribute(_ span: OTSpan, _ key: String) -> String? {
  guard case .string(let value) = attribute(span, key) else {
    return nil
  }
  return value
}

private func intAttribute(_ span: OTSpan, _ key: String) -> Int64? {
  guard case .int(let value) = attribute(span, key) else {
    return nil
  }
  return value
}

@Suite("SpanRow to OTSpan mapping")
struct SpanRowMappingTests {
  @Test
  func `passes the persisted identity through to the wire shape`() {
    // Ids are generated at record time and persisted precisely so that the export layer never
    // invents new ones — a redelivered row must stay byte-identical on the server.
    let span = makeRow(name: "POST", kind: 5).toOTSpan()
    #expect(span.traceId == "a3ce929d0e0e4736a3ce929d0e0e4736")
    #expect(span.spanId == "00f067aa0ba902b7")
    #expect(span.name == "POST")
    #expect(span.kind == 5)
  }

  @Test
  func `omits the parent span id for a root span`() {
    // The server rejects a present-but-invalid parent id, so a root span must leave it absent
    // rather than empty.
    let span = makeRow().toOTSpan()
    #expect(span.parentSpanId == nil)
  }

  @Test
  func `passes a present parent span id through`() {
    let span = makeRow(parentSpanId: "abcdef0123456789").toOTSpan()
    #expect(span.parentSpanId == "abcdef0123456789")
  }

  @Test
  func `converts the start and end timestamps to unix nanoseconds`() {
    let span = makeRow().toOTSpan()
    #expect(span.startTimeUnixNano == 1_782_131_895_000_000_000)
    #expect(span.endTimeUnixNano == 1_782_131_895_250_000_000)
  }

  @Test
  func `never reports an end that precedes the start`() {
    // The server rejects a span whose end is before its start. A clock adjustment mid-span
    // can invert the two wall-clock timestamps, so the mapping has to clamp.
    let span = makeRow(startTimestampMs: startMs, endTimestampMs: startMs - 5_000).toOTSpan()
    #expect(span.endTimeUnixNano >= span.startTimeUnixNano)
  }

  @Test
  func `clamps a far-future timestamp instead of trapping on overflow`() {
    // A corrupt row or a device clock set far into the future must never crash the host app
    // from inside the telemetry library; the nanosecond conversion saturates instead.
    let span = makeRow(startTimestampMs: Int64.max, endTimestampMs: Int64.max).toOTSpan()
    #expect(span.endTimeUnixNano >= span.startTimeUnixNano)
  }

  @Test
  func `attaches the session id as an attribute`() {
    let sessionId = UUID().uuidString
    let span = makeRow(sessionId: sessionId).toOTSpan()
    #expect(stringAttribute(span, "session.id") == sessionId)
  }

  @Test
  func `decodes the attributes blob into typed wire attributes`() {
    let json =
      #"{"http.request.method":"GET","http.response.status_code":200,"http.request.size":412,"retried":false,"sampling.rate":0.5}"#
    let span = makeRow(attributes: json).toOTSpan()
    #expect(stringAttribute(span, "http.request.method") == "GET")
    #expect(intAttribute(span, "http.response.status_code") == 200)
    #expect(intAttribute(span, "http.request.size") == 412)
    if case .bool(let retried) = attribute(span, "retried") {
      #expect(retried == false)
    } else {
      Issue.record("Expected a bool `retried` attribute")
    }
    if case .double(let rate) = attribute(span, "sampling.rate") {
      #expect(rate == 0.5)
    } else {
      Issue.record("Expected a double `sampling.rate` attribute")
    }
  }

  @Test
  func `tolerates an absent or malformed attributes blob`() {
    // Only the session attribute remains; a bad blob must not fail the whole span.
    for blob in [nil, "not json", "[1,2,3]"] {
      let span = makeRow(attributes: blob).toOTSpan()
      #expect(span.attributes.count == 1)
      #expect(span.attributes.first?.key == "session.id")
    }
  }

  @Test
  func `passes the error status and message through`() {
    let span = makeRow(statusCode: 2, statusMessage: "offline").toOTSpan()
    #expect(span.status?.code == 2)
    #expect(span.status?.message == "offline")
  }

  @Test
  func `omits the status when the row has none`() {
    // UNSET is expressed by omitting the status object entirely, per the conventions.
    let span = makeRow(statusCode: nil).toOTSpan()
    #expect(span.status == nil)
  }
}

@Suite("Span event decoding")
struct SpanEventDecodingTests {
  private func eventsJSON(count: Int) -> String {
    let events = (0..<count).map { index in
      return #"{"name":"http.redirect","attributes":{"from":"https://example.com/\#(index)","statusCode":302}}"#
    }
    return "[\(events.joined(separator: ","))]"
  }

  @Test
  func `decodes events with their attributes`() throws {
    let span = makeRow(events: eventsJSON(count: 2)).toOTSpan()
    #expect(span.events.count == 2)
    #expect(span.events.allSatisfy { $0.name == "http.redirect" })
    let first = try #require(span.events.first)
    let attributes = Dictionary(uniqueKeysWithValues: first.attributes.map { ($0.key, $0.value) })
    if case .string(let from) = attributes["from"] {
      #expect(from == "https://example.com/0")
    } else {
      Issue.record("Expected a string `from` attribute")
    }
    if case .int(let statusCode) = attributes["statusCode"] {
      #expect(statusCode == 302)
    } else {
      Issue.record("Expected an int `statusCode` attribute")
    }
  }

  @Test
  func `anchors events without a timestamp to the span start`() {
    // Producers may omit per-event timestamps; an out-of-window event is meaningless in a
    // trace waterfall, so the fallback is the span start.
    let span = makeRow(events: eventsJSON(count: 2)).toOTSpan()
    for event in span.events {
      #expect(event.timeUnixNano == span.startTimeUnixNano)
    }
  }

  @Test
  func `uses a per-event timestamp when the producer recorded one`() {
    let json = #"[{"name":"checkpoint","timeMs":\#(startMs + 100)}]"#
    let span = makeRow(events: json).toOTSpan()
    #expect(span.events.first?.timeUnixNano == 1_782_131_895_100_000_000)
  }

  @Test
  func `drops an event without a name`() {
    // The server drops nameless events anyway; skipping them locally keeps the payload honest.
    let json = #"[{"attributes":{"orphan":true}},{"name":"kept"}]"#
    let span = makeRow(events: json).toOTSpan()
    #expect(span.events.map(\.name) == ["kept"])
  }

  @Test
  func `emits no events when the row has none`() {
    let span = makeRow().toOTSpan()
    #expect(span.events.isEmpty)
    #expect(span.droppedEventsCount == 0)
  }

  @Test
  func `caps the number of emitted events at the server limit`() {
    // The server keeps at most 32 events per span and counts the rest as dropped. Sending
    // more just wastes payload, so the SDK truncates and reports the loss itself.
    let span = makeRow(events: eventsJSON(count: 40)).toOTSpan()
    #expect(span.events.count == 32)
    #expect(span.droppedEventsCount == 8)
  }
}

@Suite("Traces request body encoding")
struct OTTracesRequestBodyTests {
  private func encodeSpans(_ spans: [OTSpan]) throws -> [[String: Any]] {
    let body = OTTracesRequestBody(resourceSpans: [
      OTResourceSpans(
        resource: OTMetadata(attributes: []),
        scopeSpans: [
          OTScopeSpans(scope: OTScope(name: "expo-observe", version: "1.0.0"), spans: spans)
        ],
        schemaUrl: "https://opentelemetry.io/schemas/1.27.0"
      )
    ])
    let data = try JSONEncoder().encode(body)
    let json = try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
    let resourceSpans = try #require(json["resourceSpans"] as? [[String: Any]])
    let scopeSpans = try #require(resourceSpans.first?["scopeSpans"] as? [[String: Any]])
    return try #require(scopeSpans.first?["spans"] as? [[String: Any]])
  }

  @Test
  func `encodes the resourceSpans envelope the endpoint expects`() throws {
    let spans = try encodeSpans([makeRow().toOTSpan()])
    #expect(spans.count == 1)
    #expect(spans.first?["name"] as? String == "GET")
    #expect(spans.first?["kind"] as? Int == 3)
    #expect(spans.first?["traceId"] as? String == "a3ce929d0e0e4736a3ce929d0e0e4736")
  }

  @Test
  func `omits an absent parent span id from the encoded span`() throws {
    // The server rejects a span carrying a present-but-invalid parent id, so a root span
    // must leave the key out entirely rather than encode null or an empty string.
    let spans = try encodeSpans([makeRow().toOTSpan()])
    let encodedSpan = try #require(spans.first)
    #expect(encodedSpan.keys.contains("parentSpanId") == false)
  }
}

@Suite("Traces partial-success decoding")
struct OTTracesPartialSuccessTests {
  @Test
  func `counts rejected spans from a traces partial success`() throws {
    // The traces endpoint reports `rejectedSpans`, a field neither the metrics nor the logs
    // response carries. Without it the shared decoder reads a rejection as a clean success.
    let json = #"{"partialSuccess":{"rejectedSpans":3,"errorMessage":"bad span"}}"#
    let response = try JSONDecoder().decode(OTServiceResponse.self, from: Data(json.utf8))
    let partial = try #require(response.partialSuccess)
    #expect(partial.rejectedCount == 3)
    #expect(partial.errorMessage == "bad span")
  }
}
