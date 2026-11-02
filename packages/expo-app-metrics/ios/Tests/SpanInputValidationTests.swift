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
  func `trims the span name`() {
    #expect(validatedSpanName("  checkout\n") == "checkout")
  }

  @Test
  func `rejects a span name that trims to empty`() {
    #expect(validatedSpanName("") == nil)
    #expect(validatedSpanName(" \t ") == nil)
  }

  @Test
  func `rejects the reserved expo prefix after trimming`() {
    #expect(validatedSpanName("  expo.http") == nil)
  }

  @Test
  func `accepts span names that only resemble the reserved prefix`() {
    #expect(validatedSpanName("expoCheckout") == "expoCheckout")
    #expect(validatedSpanName("expo") == "expo")
  }

  @Test
  func `accepts a span name at the length limit and rejects one past it`() {
    let name = validatedSpanName(String(repeating: "a", count: 256))
    #expect(name?.count == 256)
    #expect(validatedSpanName(String(repeating: "a", count: 257)) == nil)
  }

  @Test
  func `measures the span name length after trimming`() {
    let name = validatedSpanName(" " + String(repeating: "a", count: 256) + " ")
    #expect(name?.count == 256)
  }

  @Test
  func `maps span statuses to OTLP status codes`() {
    #expect(spanStatusCode(from: nil) == nil)
    #expect(spanStatusCode(from: "ok") == SpanRow.statusOk)
    #expect(spanStatusCode(from: "error") == SpanRow.statusError)
  }

  @Test
  func `rejects an unknown span status`() {
    #expect(spanStatusCode(from: "cancelled") == nil)
    // Matching is case-sensitive, like the TypeScript union.
    #expect(spanStatusCode(from: "OK") == nil)
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
  func `rejects a timestamp in microseconds`() {
    #expect(unixMilliseconds(from: Double(timestampMs) * 1_000) == nil)
  }

  @Test
  func `accepts a timestamp up to one day after now`() {
    let oneDayMs: Int64 = 24 * 60 * 60 * 1_000
    #expect(unixMilliseconds(from: Double(timestampMs + oneDayMs), now: timestampMs) == timestampMs + oneDayMs)
    #expect(unixMilliseconds(from: Double(timestampMs + oneDayMs + 1), now: timestampMs) == nil)
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
  func `converts a required timestamp`() {
    #expect(requiredTimestamp(Double(timestampMs), field: "startTime") == timestampMs)
  }

  @Test
  func `rejects a missing required timestamp`() {
    #expect(requiredTimestamp(nil, field: "startTime") == nil)
  }

  @Test
  func `rejects an unusable required timestamp`() {
    #expect(requiredTimestamp(123_456.7, field: "endTime") == nil)
  }

  @Test
  func `accepts a recordSpan window that ends when it starts`() {
    let window = recordedSpanWindow(startTime: Double(timestampMs), endTime: Double(timestampMs))
    #expect(window?.start == timestampMs)
    #expect(window?.end == timestampMs)
  }

  @Test
  func `rejects a recordSpan window that ends before it starts`() {
    #expect(recordedSpanWindow(startTime: Double(timestampMs), endTime: Double(timestampMs - 1)) == nil)
  }

  @Test
  func `rejects a recordSpan window with a missing time`() {
    #expect(recordedSpanWindow(startTime: nil, endTime: Double(timestampMs)) == nil)
  }

  @Test
  func `falls back to the current time for a timestamp from the wrong clock`() {
    let before = nowMilliseconds()
    let resolved = resolvedTimestamp(123_456.7, field: "startTime")
    let after = nowMilliseconds()
    #expect((before...after).contains(resolved))
  }
}
