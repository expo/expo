import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("SpanRow identifiers")
struct SpanRowIdentifierTests {
  @Test
  func `generates a 32-character lowercase hex trace id`() {
    // The ingestion endpoint rejects any span whose trace id isn't exactly 32 hex characters.
    let traceId = SpanRow.generateTraceId()
    #expect(traceId.count == 32)
    #expect(traceId.allSatisfy { $0.isHexDigit && !$0.isUppercase })
  }

  @Test
  func `generates a 16-character lowercase hex span id`() {
    let spanId = SpanRow.generateSpanId()
    #expect(spanId.count == 16)
    #expect(spanId.allSatisfy { $0.isHexDigit && !$0.isUppercase })
  }

  @Test
  func `never generates an all-zero identifier`() {
    // An all-zero id is invalid per the OTLP spec and the server rejects the span outright.
    // A single draw can legitimately contain zero bytes, so this asserts across many draws
    // that the fully-zero degenerate value never appears.
    for _ in 0..<512 {
      #expect(SpanRow.generateTraceId() != String(repeating: "0", count: 32))
      #expect(SpanRow.generateSpanId() != String(repeating: "0", count: 16))
    }
  }

  @Test
  func `generates distinct identifiers on each call`() {
    var seen = Set<String>()
    for _ in 0..<128 {
      seen.insert(SpanRow.generateTraceId())
    }
    #expect(seen.count == 128)
  }

  @Test
  func `a new row receives generated identifiers by default`() {
    // Ids are assigned once at record time and persisted, so a redelivered row (export is
    // at-least-once) reaches the server byte-identical instead of becoming a fresh duplicate.
    let first = SpanRow(sessionId: "s", name: "GET", startTimestampMs: 0, endTimestampMs: 1)
    let second = SpanRow(sessionId: "s", name: "GET", startTimestampMs: 0, endTimestampMs: 1)
    #expect(first.traceId.count == 32)
    #expect(first.spanId.count == 16)
    #expect(first.traceId != second.traceId)
    #expect(first.spanId != second.spanId)
  }
}
