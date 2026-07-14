// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@Suite("JavaScriptCodable+Date")
@JavaScriptActor
struct JavaScriptCodableDateTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Decode

  @Test
  func `decodes a JS Date to the same instant`() throws {
    // 2021-01-01T00:00:00.000Z expressed as an absolute UTC millisecond instant. `Date.UTC` returns
    // that instant directly, so no local timezone enters the JS side.
    let value = try runtime.eval("new Date(Date.UTC(2021, 0, 1, 0, 0, 0, 0))")
    let decoded = try Date.decode(value, in: runtime)
    #expect(decoded.timeIntervalSince1970 == 1_609_459_200.0)
  }

  @Test
  func `decodes the Unix epoch`() throws {
    let decoded = try Date.decode(runtime.eval("new Date(0)"), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 0.0)
  }

  @Test
  func `decodes a pre-epoch Date`() throws {
    // A negative millisecond instant (1960-01-01T00:00:00Z) must decode to a negative interval.
    let value = try runtime.eval("new Date(Date.UTC(1960, 0, 1))")
    let decoded = try Date.decode(value, in: runtime)
    #expect(decoded.timeIntervalSince1970 == -315_619_200.0)
  }

  @Test
  func `decode preserves sub-second milliseconds`() throws {
    // Assert on the whole-millisecond instant (an integer-valued Double, always exact) rather than the
    // reconstructed fractional seconds, whose last bit can differ by an ULP across the JS boundary.
    let decoded = try Date.decode(runtime.eval("new Date(1234)"), in: runtime)
    #expect((decoded.timeIntervalSince1970 * 1000.0).rounded() == 1234.0)
  }

  @Test
  func `decodes a JS Date through the borrowed-value overload`() throws {
    // `Date` does not override the zero-copy overload (it needs a `getTime()` call), so this goes
    // through the default that copies the borrowed value into an owning one and forwards.
    let value = try runtime.eval("new Date(5000)")
    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [value])
    let decoded = try Date.decode(buffer.unownedValue(at: 0), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 5.0)
  }

  // MARK: - Encode

  @Test
  func `encodes a Date to a JS Date`() throws {
    let encoded = try Date.encode(Date(timeIntervalSince1970: 1_609_459_200.0), in: runtime)
    #expect(encoded.is("Date") == true)
  }

  @Test
  func `encoded Date carries the same instant into JS`() throws {
    // Cross-check the encoded value against JS's own `getTime()`, so the assertion is that JS and
    // Swift agree on the absolute millisecond instant — not merely that a Date was produced.
    let date = Date(timeIntervalSince1970: 1_609_459_200.0)
    let encoded = try Date.encode(date, in: runtime)
    let millisecondsInJS = try encoded.asObject().callFunction("getTime").asDouble()
    #expect(millisecondsInJS == 1_609_459_200_000.0)
  }

  // MARK: - Timezone / calendar independence

  @Test
  func `instant is independent of the JS Date's local-time getters`() throws {
    // Build the same absolute instant two ways: from a UTC millisecond value, and from local-time
    // components. `Date.UTC` and the `new Date(y, m, d, …)` local constructor produce different
    // instants unless the runtime is at UTC, so we decode the explicitly-UTC one and assert the
    // instant matches its `getTime()` exactly. The point: decode reads `getTime()` (absolute UTC ms),
    // never a local-time getter, so no timezone offset is folded in.
    let value = try runtime.eval("new Date(Date.UTC(2021, 5, 15, 12, 30, 45, 123))")
    let expectedMilliseconds = try value.asObject().callFunction("getTime").asDouble()
    let decoded = try Date.decode(value, in: runtime)
    #expect((decoded.timeIntervalSince1970 * 1000.0).rounded() == expectedMilliseconds)
  }

  @Test
  func `round-trip is calendar and timezone agnostic`() throws {
    // A `Date` is an absolute instant with no stored calendar or timezone; both JS `Date` and Swift
    // `Date` are epoch-relative. This encodes to JS and decodes back, asserting the instant is
    // unchanged at millisecond granularity regardless of the ambient calendar/timezone.
    let original = Date(timeIntervalSince1970: 1_655_296_245.123)
    let encoded = try Date.encode(original, in: runtime)
    let roundTripped = try Date.decode(encoded, in: runtime)
    // Compare at whole-millisecond granularity (JS `Date`'s resolution); the original is already an
    // exact number of milliseconds, so nothing is lost, but the comparison avoids float-equality ULP noise.
    #expect(
      (roundTripped.timeIntervalSince1970 * 1000.0).rounded() == (original.timeIntervalSince1970 * 1000.0).rounded())
  }

  @Test
  func `round-trip drops sub-millisecond precision`() throws {
    // JS `Date` is integer-millisecond resolution, so the microsecond tail of a Swift `Date` is lost
    // on the way through JS. The round-trip lands on the truncated whole millisecond (JS's `Date`
    // constructor truncates the fractional millisecond toward zero), and no longer equals the original.
    let original = Date(timeIntervalSince1970: 1.2345678)
    let roundTripped = try Date.decode(Date.encode(original, in: runtime), in: runtime)
    #expect((roundTripped.timeIntervalSince1970 * 1000.0).rounded() == 1234.0)
    #expect(roundTripped.timeIntervalSince1970 != original.timeIntervalSince1970)
  }

  @Test
  func `Date current time round-trips to the millisecond`() throws {
    let now = Date()
    let roundTripped = try Date.decode(Date.encode(now, in: runtime), in: runtime)
    // Truncate the original to whole milliseconds (JS's resolution) and compare on the millisecond
    // instant, which is an exact integer-valued Double on both sides.
    let nowMilliseconds = (now.timeIntervalSince1970 * 1000.0).rounded(.towardZero)
    #expect((roundTripped.timeIntervalSince1970 * 1000.0).rounded() == nowMilliseconds)
  }

  // MARK: - Decode from a JS number (milliseconds since the epoch)

  @Test
  func `decodes a number as milliseconds since the epoch`() throws {
    // A JS number is interpreted the same way `new Date(ms)` interprets it, so `getTime()` round-trips.
    let decoded = try Date.decode(runtime.eval("1609459200000"), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 1_609_459_200.0)
  }

  @Test
  func `decodes zero as the Unix epoch`() throws {
    let decoded = try Date.decode(runtime.eval("0"), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 0.0)
  }

  @Test
  func `decodes a negative number as a pre-epoch instant`() throws {
    let decoded = try Date.decode(runtime.eval("-315619200000"), in: runtime)
    #expect(decoded.timeIntervalSince1970 == -315_619_200.0)
  }

  @Test
  func `a JS Date's getTime decodes to the same instant as the Date`() throws {
    // Passing `someDate` and passing `someDate.getTime()` must decode to the same Swift `Date`.
    let fromDate = try Date.decode(runtime.eval("new Date(Date.UTC(2021, 0, 1))"), in: runtime)
    let fromMilliseconds = try Date.decode(runtime.eval("new Date(Date.UTC(2021, 0, 1)).getTime()"), in: runtime)
    #expect(fromDate.timeIntervalSince1970 == fromMilliseconds.timeIntervalSince1970)
  }

  @Test
  func `decode truncates a fractional number toward zero like the Date constructor`() throws {
    // `new Date(1.9).getTime()` is `1` and `new Date(-1.9).getTime()` is `-1`: the constructor applies
    // TimeClip (truncate toward zero), so the number branch must too rather than keeping 1.9 ms.
    let positive = try Date.decode(runtime.eval("1.9"), in: runtime)
    #expect((positive.timeIntervalSince1970 * 1000.0).rounded() == 1.0)
    let negative = try Date.decode(runtime.eval("-1.9"), in: runtime)
    #expect((negative.timeIntervalSince1970 * 1000.0).rounded() == -1.0)
  }

  @Test
  func `decode accepts the maximum representable JS date`() throws {
    // ±8.64e15 ms (100,000,000 days from the epoch) is the inclusive bound of a valid JS `Date`.
    let maximum = try Date.decode(runtime.eval("8640000000000000"), in: runtime)
    #expect((maximum.timeIntervalSince1970 * 1000.0) == 8_640_000_000_000_000.0)
    let minimum = try Date.decode(runtime.eval("-8640000000000000"), in: runtime)
    #expect((minimum.timeIntervalSince1970 * 1000.0) == -8_640_000_000_000_000.0)
  }

  @Test
  func `decode rejects a number beyond the JS date range`() throws {
    // One millisecond past the bound is an `Invalid Date` in JS (`new Date(8640000000000001).getTime()`
    // is `NaN`), so decode must reject it rather than accept an instant JS `Date` can't hold.
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("8640000000000001"), in: runtime)
    }
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("-8640000000000001"), in: runtime)
    }
  }

  @Test
  func `decode matches new Date for the same number`() throws {
    // Cross-check the number branch against the constructor for values that exercise TimeClip.
    for source in ["1.9", "-1.9", "0.4", "1234.5678", "8640000000000000"] {
      let expected = try runtime.eval("new Date(\(source)).getTime()").asDouble()
      let decoded = try Date.decode(runtime.eval(source), in: runtime)
      #expect((decoded.timeIntervalSince1970 * 1000.0).rounded() == expected)
    }
  }

  // MARK: - Decode from a string (parsed by the JS `Date` constructor)

  @Test
  func `decodes an ISO 8601 string with fractional seconds`() throws {
    let decoded = try Date.decode(runtime.eval("\"2021-01-01T00:00:00.123Z\""), in: runtime)
    #expect((decoded.timeIntervalSince1970 * 1000.0).rounded() == 1_609_459_200_123.0)
  }

  @Test
  func `decodes an ISO 8601 string without fractional seconds`() throws {
    let decoded = try Date.decode(runtime.eval("\"2021-01-01T00:00:00Z\""), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 1_609_459_200.0)
  }

  @Test
  func `decodes an ISO 8601 string with a timezone offset to the correct UTC instant`() throws {
    // 01:00 at +01:00 is the same absolute instant as 00:00 UTC; the offset must be applied, not ignored.
    let decoded = try Date.decode(runtime.eval("\"2021-01-01T01:00:00+01:00\""), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 1_609_459_200.0)
  }

  @Test
  func `decodes a date-only string as UTC midnight`() throws {
    // The JS `Date` constructor reads a date-only ISO string as UTC midnight (unlike a zone-less
    // date-time, which it reads as local). This form is accepted here because `new Date(str)` accepts it.
    let decoded = try Date.decode(runtime.eval("\"2021-01-01\""), in: runtime)
    #expect(decoded.timeIntervalSince1970 == 1_609_459_200.0)
  }

  @Test
  func `decodes a string the same way new Date parses it`() throws {
    // The decode contract for a string is "exactly what `new Date(str)` produces". Cross-check the
    // decoded instant against the engine's own parse of the same string, so this holds for whatever
    // date grammar the runtime supports (ISO, RFC-2822-ish, etc.), identically on every platform.
    let source = "\"2021-06-15T12:30:45.500Z\""
    let expectedMilliseconds = try runtime.eval("new Date(\(source)).getTime()").asDouble()
    let decoded = try Date.decode(runtime.eval(source), in: runtime)
    #expect((decoded.timeIntervalSince1970 * 1000.0).rounded() == expectedMilliseconds)
  }

  // MARK: - Error paths

  @Test
  func `Date decode throws on an unparseable string`() throws {
    // `new Date(...)` yields an `Invalid Date` (NaN time) rather than throwing; decode turns that NaN
    // into a thrown error.
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("\"not a date\""), in: runtime)
    }
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("\"\""), in: runtime)
    }
  }

  @Test
  func `Date decode throws on NaN`() throws {
    // A NaN number produces an `Invalid Date` in JS; decode must reject it rather than yield a bogus instant.
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("NaN"), in: runtime)
    }
  }

  @Test
  func `Date decode throws on an unsupported type`() throws {
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("({})"), in: runtime)
    }
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("null"), in: runtime)
    }
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("true"), in: runtime)
    }
    #expect(throws: InvalidDateException.self) {
      _ = try Date.decode(runtime.eval("[1, 2, 3]"), in: runtime)
    }
  }
}
