import Foundation
import Testing

@testable import ExpoAppMetrics

private let timestampMs: Int64 = 1_782_131_895_000

private func nowMilliseconds() -> Int64 {
  return Int64((Date().timeIntervalSince1970 * 1_000).rounded())
}

@Suite("Span input validation")
struct SpanInputValidationTests {
  @Test
  func `trims the span name`() throws {
    #expect(try validatedSpanName("  checkout\n") == "checkout")
  }

  @Test
  func `rejects a span name that trims to empty`() {
    #expect(throws: EmptySpanNameException.self) {
      try validatedSpanName("")
    }
    #expect(throws: EmptySpanNameException.self) {
      try validatedSpanName(" \t ")
    }
  }

  @Test
  func `rejects the reserved expo prefix after trimming`() {
    #expect(throws: ReservedSpanNameException.self) {
      try validatedSpanName("  expo.http")
    }
  }

  @Test
  func `accepts span names that only resemble the reserved prefix`() throws {
    #expect(try validatedSpanName("expoCheckout") == "expoCheckout")
    #expect(try validatedSpanName("expo") == "expo")
  }

  @Test
  func `accepts a span name at the length limit and rejects one past it`() throws {
    let name = try validatedSpanName(String(repeating: "a", count: 256))
    #expect(name.count == 256)
    #expect(throws: SpanNameTooLongException.self) {
      try validatedSpanName(String(repeating: "a", count: 257))
    }
  }

  @Test
  func `measures the span name length after trimming`() throws {
    let name = try validatedSpanName(" " + String(repeating: "a", count: 256) + " ")
    #expect(name.count == 256)
  }

  @Test
  func `maps span statuses to OTLP status codes`() throws {
    #expect(try spanStatusCode(from: nil) == nil)
    #expect(try spanStatusCode(from: "ok") == SpanRow.statusOk)
    #expect(try spanStatusCode(from: "error") == SpanRow.statusError)
  }

  @Test
  func `rejects an unknown span status`() {
    #expect(throws: InvalidSpanStatusException.self) {
      try spanStatusCode(from: "cancelled")
    }
    // Matching is case-sensitive, like the TypeScript union.
    #expect(throws: InvalidSpanStatusException.self) {
      try spanStatusCode(from: "OK")
    }
  }

  @Test
  func `truncates fractional milliseconds`() {
    #expect(unixMilliseconds(from: Double(timestampMs) + 0.9) == timestampMs)
  }

  @Test
  func `rejects non-finite timestamps`() {
    #expect(unixMilliseconds(from: .nan) == nil)
    #expect(unixMilliseconds(from: .infinity) == nil)
    #expect(unixMilliseconds(from: -.infinity) == nil)
  }

  @Test
  func `rejects a timestamp past the 64-bit range`() {
    // `Double(Int64.max)` rounds up to 2^63, which no `Int64` can hold.
    #expect(unixMilliseconds(from: Double(Int64.max)) == nil)
    #expect(unixMilliseconds(from: Double(Int64.max).nextDown) == 9_223_372_036_854_774_784)
  }

  @Test
  func `rejects a timestamp from the wrong clock or in the wrong unit`() {
    // A `performance.now()` value measures uptime, and a timestamp in seconds is 1000 times too small.
    #expect(unixMilliseconds(from: 123_456.7) == nil)
    #expect(unixMilliseconds(from: Double(timestampMs) / 1_000) == nil)
    #expect(unixMilliseconds(from: 0) == nil)
    #expect(unixMilliseconds(from: -1) == nil)
  }

  @Test
  func `accepts the earliest plausible timestamp`() {
    #expect(unixMilliseconds(from: 1_000_000_000_000) == 1_000_000_000_000)
  }

  @Test
  func `resolves a usable timestamp to itself`() {
    #expect(resolvedTimestamp(Double(timestampMs), field: "startTime") == timestampMs)
  }

  @Test
  func `falls back to the current time for a missing or unusable timestamp`() {
    let before = nowMilliseconds()
    let missing = resolvedTimestamp(nil, field: "startTime")
    let unusable = resolvedTimestamp(.nan, field: "startTime")
    let after = nowMilliseconds()
    #expect((before...after).contains(missing))
    #expect((before...after).contains(unusable))
  }

  @Test
  func `converts a required timestamp`() throws {
    #expect(try requiredTimestamp(Double(timestampMs), field: "startTime") == timestampMs)
  }

  @Test
  func `rejects a missing required timestamp`() {
    #expect(throws: MissingSpanWindowException.self) {
      try requiredTimestamp(nil, field: "startTime")
    }
  }

  @Test
  func `rejects an unusable required timestamp with an error naming the field`() {
    let error = #expect(throws: InvalidSpanTimestampException.self) {
      try requiredTimestamp(123_456.7, field: "endTime")
    }
    #expect(error?.reason.contains("`endTime`") == true)
  }

  @Test
  func `falls back to the current time for a timestamp from the wrong clock`() {
    let before = nowMilliseconds()
    let resolved = resolvedTimestamp(123_456.7, field: "startTime")
    let after = nowMilliseconds()
    #expect((before...after).contains(resolved))
  }
}
