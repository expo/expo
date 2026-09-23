import Foundation
import Testing

@testable import ExpoAppMetrics

/// Yields the scripted values in order, then a fixed non-zero fallback.
private struct ScriptedGenerator: RandomNumberGenerator {
  var values: [UInt64]
  private var index = 0

  init(values: [UInt64]) {
    self.values = values
  }

  mutating func next() -> UInt64 {
    defer {
      index += 1
    }
    return index < values.count ? values[index] : 42
  }
}

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
  func `redraws when the generator produces the all-zero identifier`() {
    // An all-zero id is invalid per the OTLP spec and the server rejects the span outright.
    // A real generator hits the zero draw once per 2^64 draws, so this injects one that yields
    // zeros first and proves the redraw branch produces the next non-zero value instead.
    var generator = ScriptedGenerator(values: [0, 0, 1, 2])
    let id = SpanRow.generateHexId(words: 2, using: &generator)
    #expect(id == String(format: "%016llx%016llx", UInt64(1), UInt64(2)))
  }

  @Test
  func `generates distinct identifiers on each call`() {
    var traceIds = Set<String>()
    var spanIds = Set<String>()
    for _ in 0..<128 {
      traceIds.insert(SpanRow.generateTraceId())
      spanIds.insert(SpanRow.generateSpanId())
    }
    #expect(traceIds.count == 128)
    #expect(spanIds.count == 128)
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
