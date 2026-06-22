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
  func `2xx with partial_success rejected count returns nonRetryable`() {
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
    guard case .nonRetryable(let reason) = result else {
      Issue.record("expected .nonRetryable, got \(result)")
      return
    }
    #expect(reason.contains("rejected 3"))
    #expect(reason.contains("metric_kind_mismatch"))
  }

  @Test
  func `2xx with partial_success rejected logs returns nonRetryable`() {
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
    guard case .nonRetryable(let reason) = result else {
      Issue.record("expected .nonRetryable, got \(result)")
      return
    }
    #expect(reason.contains("rejected 1"))
    #expect(reason.contains("log_too_large"))
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
    #expect(result == .retryable(retryAfter: nil))
  }

  @Test
  func `429 with Retry-After seconds is parsed`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 429,
      retryAfterHeader: "30",
      partialSuccess: nil
    )
    #expect(result == .retryable(retryAfter: 30))
  }

  @Test
  func `503 returns retryable and propagates Retry-After`() {
    let result = DispatchUtils.classifyResponse(
      statusCode: 503,
      retryAfterHeader: "5",
      partialSuccess: nil
    )
    #expect(result == .retryable(retryAfter: 5))
  }

  @Test
  func `408 412 502 504 are retryable`() {
    for code in [408, 502, 504] {
      let result = DispatchUtils.classifyResponse(
        statusCode: code,
        retryAfterHeader: nil,
        partialSuccess: nil
      )
      #expect(result == .retryable(retryAfter: nil), "status \(code) should be retryable")
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
    guard case .nonRetryable(let reason) = result else {
      Issue.record("expected .nonRetryable, got \(result)")
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
    guard case .nonRetryable = result else {
      Issue.record("expected .nonRetryable, got \(result)")
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
    guard case .nonRetryable = result else {
      Issue.record("expected .nonRetryable, got \(result)")
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
    guard case .nonRetryable = result else {
      Issue.record("expected .nonRetryable, got \(result)")
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
      guard case .nonRetryable = result else {
        Issue.record("status \(code) should be .nonRetryable, got \(result)")
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
  @Test
  func `nil header returns nil`() {
    #expect(DispatchUtils.parseRetryAfter(nil) == nil)
  }

  @Test
  func `empty or whitespace header returns nil`() {
    #expect(DispatchUtils.parseRetryAfter("") == nil)
    #expect(DispatchUtils.parseRetryAfter("   ") == nil)
  }

  @Test
  func `integer seconds parses to TimeInterval`() {
    #expect(DispatchUtils.parseRetryAfter("0") == 0)
    #expect(DispatchUtils.parseRetryAfter("30") == 30)
    #expect(DispatchUtils.parseRetryAfter("3600") == 3600)
  }

  @Test
  func `negative seconds clamps to zero`() {
    // Defensive: a misbehaving server shouldn't be able to make us schedule the next dispatch
    // in the past (or, worse, give us a negative sleep).
    #expect(DispatchUtils.parseRetryAfter("-1") == 0)
  }

  @Test
  func `fractional seconds parse`() {
    // `TimeInterval` is `Double`; the RFC technically requires an integer but real servers
    // sometimes emit `Retry-After: 0.5` and there's no harm in honoring it.
    #expect(DispatchUtils.parseRetryAfter("0.5") == 0.5)
  }

  @Test
  func `HTTP-date header parses to delta from now`() {
    // Build a header that points 60 seconds in the future and verify the parsed delta is in
    // the [55, 65] range (allowing for clock drift / test latency).
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
    let future = Date().addingTimeInterval(60)
    let header = formatter.string(from: future)

    let parsed = DispatchUtils.parseRetryAfter(header)
    #expect(parsed != nil)
    if let parsed {
      #expect(parsed >= 55 && parsed <= 65, "expected ~60 s, got \(parsed)")
    }
  }

  @Test
  func `HTTP-date in the past clamps to zero`() {
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = TimeZone(identifier: "GMT")
    formatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
    let past = Date().addingTimeInterval(-3600)
    #expect(DispatchUtils.parseRetryAfter(formatter.string(from: past)) == 0)
  }

  @Test
  func `garbage header returns nil`() {
    #expect(DispatchUtils.parseRetryAfter("tomorrow morning") == nil)
    #expect(DispatchUtils.parseRetryAfter("Mon Jun 16") == nil)
  }
}
