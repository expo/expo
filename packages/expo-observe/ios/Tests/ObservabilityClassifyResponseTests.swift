import Foundation
import Testing

@testable import ExpoObserve

@Suite("DispatchUtils.classifyResponse")
struct ObservabilityClassifyResponseTests {
  // MARK: - 2xx

  @Test
  func `2xx with no partial_success returns success`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 200,
      retryAfterHeader: nil,
      partialSuccess: nil
    )
    #expect(result == .success)
  }

  @Test
  func `2xx with partial_success rejected data points returns partialSuccess`() {
    let partial = OTPartialSuccess(
      rejectedDataPoints: 3,
      rejectedLogRecords: nil,
      errorMessage: "metric_kind_mismatch"
    )
    let result = DispatchUtils.classifyResponse(
      statusCode: 200,
      retryAfterHeader: nil,
      partialSuccess: partial
    )
    #expect(result == .partialSuccess(partial))
  }

  @Test
  func `2xx with partial_success rejected log records returns partialSuccess`() {
    // The same response struct serves both metrics and logs endpoints; the logs response uses
    // `rejectedLogRecords` instead of `rejectedDataPoints`.
    let partial = OTPartialSuccess(
      rejectedDataPoints: nil,
      rejectedLogRecords: 1,
      errorMessage: "log_too_large"
    )
    let result = DispatchUtils.classifyResponse(
      statusCode: 200,
      retryAfterHeader: nil,
      partialSuccess: partial
    )
    #expect(result == .partialSuccess(partial))
  }

  @Test
  func `2xx with partial_success warning only (rejected zero) returns success`() {
    // Per OTLP spec, a `partial_success` with `rejectedCount == 0` plus a non-empty
    // `errorMessage` is a warning — the records DID land, so don't double-drop them.
    let partial = OTPartialSuccess(
      rejectedDataPoints: 0,
      rejectedLogRecords: 0,
      errorMessage: "deprecation_warning"
    )
    let result = DispatchUtils.classifyResponse(
      statusCode: 200,
      retryAfterHeader: nil,
      partialSuccess: partial
    )
    #expect(result == .success)
  }

  @Test
  func `204 no content with no partial_success returns success`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 204,
      retryAfterHeader: nil,
      partialSuccess: nil
    )
    #expect(result == .success)
  }

  // MARK: - Retryable status codes per OTLP spec (408, 429, 502, 503, 504)

  @Test
  func `429 returns retryable`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 429,
      retryAfterHeader: nil,
      partialSuccess: nil
    )
    #expect(result == .retryableFailure(retryAfter: nil))
  }

  @Test
  func `429 with Retry-After inside client bounds is parsed as-is`() {
    // 120 s sits between base (60) and cap (900), so it propagates unchanged.
    let result = DispatchUtils.classifyResponse(
      statusCode: 429,
      retryAfterHeader: "120",
      partialSuccess: nil
    )
    #expect(result == .retryableFailure(retryAfter: 120))
  }

  @Test
  func `503 Retry-After below base clamps up to base`() {
    // 5 s is below the 60 s floor — the client wouldn't dispatch faster than that anyway, so
    // honor the server's intent to slow down by snapping up to base.
    let result = DispatchUtils.classifyResponse(
      statusCode: 503,
      retryAfterHeader: "5",
      partialSuccess: nil
    )
    #expect(result == .retryableFailure(retryAfter: DispatchUtils.backoffBaseSeconds))
  }

  @Test
  func `429 502 504 are retryable`() {
    // 429 and 503 have their own dedicated tests above (with and without Retry-After);
    // this loop covers the remaining retryable codes in OTLP's set. 412 (Precondition
    // Failed) is intentionally NOT here — it's not in OTLP's retryable set and would
    // correctly fall through to .nonRetryableFailure.
    for code in [429, 502, 504] {
      let result = DispatchUtils.classifyResponse(
        statusCode: code,
        retryAfterHeader: nil,
        partialSuccess: nil
      )
      #expect(result == .retryableFailure(retryAfter: nil), "status \(code) should be retryable")
    }
  }

  // MARK: - Non-retryable 4xx / other 5xx

  @Test
  func `400 returns nonRetryable`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 400,
      retryAfterHeader: nil,
      partialSuccess: nil,
      bodyExcerpt: { "bad request" }
    )
    guard case .nonRetryableFailure(let reason) = result else {
      Issue.record("expected .nonRetryableFailure, got \(result)")
      return
    }
    #expect(reason.contains("400"))
    #expect(reason.contains("bad request"))
  }

  @Test
  func `401 returns nonRetryable`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 401,
      retryAfterHeader: nil,
      partialSuccess: nil
    )
    guard case .nonRetryableFailure = result else {
      Issue.record("expected .nonRetryableFailure, got \(result)")
      return
    }
  }

  @Test
  func `403 returns nonRetryable`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 403,
      retryAfterHeader: nil,
      partialSuccess: nil
    )
    guard case .nonRetryableFailure = result else {
      Issue.record("expected .nonRetryableFailure, got \(result)")
      return
    }
  }

  @Test
  func `404 returns nonRetryable`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 404,
      retryAfterHeader: nil,
      partialSuccess: nil
    )
    guard case .nonRetryableFailure = result else {
      Issue.record("expected .nonRetryableFailure, got \(result)")
      return
    }
  }

  @Test
  func `other 5xx returns nonRetryable`() {
    // 501 (Not Implemented) and 505 (HTTP Version Not Supported) are NOT in OTLP's retry list;
    // they describe persistent server-side mismatches. Retrying doesn't fix them.
    for code in [501, 505] {
      let result = DispatchUtils.classifyResponse(
        statusCode: code,
        retryAfterHeader: nil,
        partialSuccess: nil
      )
      guard case .nonRetryableFailure = result else {
        Issue.record("status \(code) should be .nonRetryableFailure, got \(result)")
        continue
      }
    }
  }

  @Test
  func `nonRetryable reason omits body excerpt when not requested`() {
    // The excerpt closure is only invoked for non-retryable results that benefit from it.
    // Retryable codes shouldn't pay the cost — verify the closure isn't called on 429.
    var bodyClosureCalled = false
    _ = DispatchUtils.classifyResponse(
      statusCode: 429,
      retryAfterHeader: nil,
      partialSuccess: nil,
      bodyExcerpt: {
        bodyClosureCalled = true
        return ""
      }
    )
    #expect(bodyClosureCalled == false)
  }
}

@Suite("DispatchUtils.parseRetryAfter")
struct ObservabilityParseRetryAfterTests {
  /// Test-local bounds passed explicitly to every call so the suite is independent of the
  /// production constants. Tests using the default-argument values are listed separately.
  private let base: TimeInterval = 60
  private let cap: TimeInterval = 900

  // MARK: - Missing / unparseable inputs return nil (caller falls through to backoff)

  @Test
  func `nil header returns nil`() {
    #expect(DispatchUtils.parseRetryAfter(nil, base: base, cap: cap) == nil)
  }

  @Test
  func `empty or whitespace header returns nil`() {
    #expect(DispatchUtils.parseRetryAfter("", base: base, cap: cap) == nil)
    #expect(DispatchUtils.parseRetryAfter("   ", base: base, cap: cap) == nil)
    #expect(DispatchUtils.parseRetryAfter("\t\n", base: base, cap: cap) == nil)
  }

  @Test
  func `garbage header returns nil`() {
    // Neither a Double nor an RFC 7231 HTTP-date — caller should fall through to backoff.
    let cases = [
      "tomorrow morning",
      "Mon Jun 16",  // partial date, missing time + year + zone
      "30 minutes",  // delta-seconds doesn't accept units
      "30s",
      "abc",
      "300/600",
      ", 30",
      "30,",
    ]
    for header in cases {
      #expect(
        DispatchUtils.parseRetryAfter(header, base: base, cap: cap) == nil,
        "expected nil for garbage header \"\(header)\""
      )
    }
  }

  @Test
  func `non-finite numeric tokens return nil`() {
    // `Double(_:)` happily parses `inf`, `-inf`, `nan`, `infinity` — but feeding any of those
    // into the gate deadline is a bug. Reject them as garbage so the caller falls through to
    // `computeBackoffDelay`, which is bounded by construction.
    for header in ["inf", "Inf", "infinity", "Infinity", "-inf", "nan", "NaN"] {
      #expect(
        DispatchUtils.parseRetryAfter(header, base: base, cap: cap) == nil,
        "expected nil for non-finite numeric \"\(header)\""
      )
    }
  }

  // MARK: - delta-seconds (numeric)

  @Test
  func `delta-seconds inside [base, cap] returns the parsed value unchanged`() {
    #expect(DispatchUtils.parseRetryAfter("60", base: base, cap: cap) == 60)
    #expect(DispatchUtils.parseRetryAfter("120", base: base, cap: cap) == 120)
    #expect(DispatchUtils.parseRetryAfter("900", base: base, cap: cap) == 900)
  }

  @Test
  func `delta-seconds below base clamps up to base`() {
    // `Retry-After: 0` is the most common misbehavior — a server that wants us to retry
    // immediately. Snap to base so we don't hammer the recovering endpoint.
    #expect(DispatchUtils.parseRetryAfter("0", base: base, cap: cap) == base)
    #expect(DispatchUtils.parseRetryAfter("1", base: base, cap: cap) == base)
    #expect(DispatchUtils.parseRetryAfter("30", base: base, cap: cap) == base)
    #expect(DispatchUtils.parseRetryAfter("0.5", base: base, cap: cap) == base)
  }

  @Test
  func `delta-seconds above cap clamps down to cap`() {
    // A pathological server response shouldn't be able to wedge us in a multi-hour snooze.
    #expect(DispatchUtils.parseRetryAfter("901", base: base, cap: cap) == cap)
    #expect(DispatchUtils.parseRetryAfter("3600", base: base, cap: cap) == cap)
    #expect(DispatchUtils.parseRetryAfter("86400", base: base, cap: cap) == cap)
    #expect(DispatchUtils.parseRetryAfter("1e9", base: base, cap: cap) == cap)
  }

  @Test
  func `negative delta-seconds clamps up to base`() {
    // A negative delta would otherwise schedule the next dispatch in the past — bounce it
    // to the floor so the gate is still a real pause.
    #expect(DispatchUtils.parseRetryAfter("-1", base: base, cap: cap) == base)
    #expect(DispatchUtils.parseRetryAfter("-3600", base: base, cap: cap) == base)
  }

  @Test
  func `leading and trailing whitespace is trimmed before parsing`() {
    #expect(DispatchUtils.parseRetryAfter("  120  ", base: base, cap: cap) == 120)
    #expect(DispatchUtils.parseRetryAfter("\n120\t", base: base, cap: cap) == 120)
  }

  // MARK: - HTTP-date

  @Test
  func `HTTP-date inside bounds parses to a delta near the actual offset`() {
    // Build a header 5 minutes (300 s) in the future — comfortably inside [60, 900].
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
    let future = Date().addingTimeInterval(300)
    let header = formatter.string(from: future)

    let parsed = DispatchUtils.parseRetryAfter(header, base: base, cap: cap)
    #expect(parsed != nil)
    if let parsed {
      #expect(parsed >= 295 && parsed <= 305, "expected ~300 s, got \(parsed)")
    }
  }

  @Test
  func `HTTP-date in the past clamps up to base`() {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
    let past = Date().addingTimeInterval(-3600)
    #expect(DispatchUtils.parseRetryAfter(formatter.string(from: past), base: base, cap: cap) == base)
  }

  @Test
  func `HTTP-date far in the future clamps down to cap`() {
    // Two hours from now is well past the 15-minute cap.
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
    let farFuture = Date().addingTimeInterval(7200)
    #expect(DispatchUtils.parseRetryAfter(formatter.string(from: farFuture), base: base, cap: cap) == cap)
  }

  // MARK: - Custom client bounds

  @Test
  func `custom base and cap override the defaults`() {
    // The same input ("100") clamps differently depending on the bounds passed in: with the
    // default [60, 900] it sits inside, but a stricter [120, 600] window snaps it up to 120.
    #expect(DispatchUtils.parseRetryAfter("100") == 100)
    #expect(DispatchUtils.parseRetryAfter("100", base: 120, cap: 600) == 120)
    #expect(DispatchUtils.parseRetryAfter("100", base: 10, cap: 50) == 50)
  }
}
