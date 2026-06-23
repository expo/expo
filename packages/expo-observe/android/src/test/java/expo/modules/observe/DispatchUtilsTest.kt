package expo.modules.observe

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Unit tests for the pure classification + Retry-After parsing helpers. No network, no
 * coroutines — these are the building blocks `EventDispatcher` calls into. Network behavior
 * is covered separately in `EventDispatcherTest` against a MockWebServer.
 */
class DispatchUtilsClassifyResponseTest {
  // MARK: -- 2xx

  @Test
  fun `2xx with no body returns Success`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 200,
      retryAfterHeader = null,
      responseBody = null
    )
    assertEquals(DispatchResult.Success, result)
  }

  @Test
  fun `2xx with empty body returns Success`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 200,
      retryAfterHeader = null,
      responseBody = ""
    )
    assertEquals(DispatchResult.Success, result)
  }

  @Test
  fun `2xx with partialSuccess rejectedDataPoints returns NonRetryable`() {
    val body = """{"partialSuccess":{"rejectedDataPoints":3,"errorMessage":"metric_kind_mismatch"}}"""
    val result = DispatchUtils.classifyResponse(
      statusCode = 200,
      retryAfterHeader = null,
      responseBody = body
    )
    assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
    val reason = (result as DispatchResult.NonRetryable).reason
    assertTrue(reason.contains("rejected 3"))
    assertTrue(reason.contains("metric_kind_mismatch"))
  }

  @Test
  fun `2xx with partialSuccess rejectedLogRecords returns NonRetryable`() {
    // The same response struct serves both metrics and logs endpoints; the logs response uses
    // `rejectedLogRecords` instead of `rejectedDataPoints`.
    val body = """{"partialSuccess":{"rejectedLogRecords":1,"errorMessage":"log_too_large"}}"""
    val result = DispatchUtils.classifyResponse(
      statusCode = 200,
      retryAfterHeader = null,
      responseBody = body
    )
    assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
    val reason = (result as DispatchResult.NonRetryable).reason
    assertTrue(reason.contains("rejected 1"))
    assertTrue(reason.contains("log_too_large"))
  }

  @Test
  fun `2xx with partialSuccess warning only (rejected zero) returns Success`() {
    // Per OTLP spec, a `partial_success` with `rejectedCount == 0` plus a non-empty
    // `errorMessage` is a warning — the records DID land, so don't double-drop them.
    val body = """{"partialSuccess":{"rejectedDataPoints":0,"errorMessage":"deprecation_warning"}}"""
    val result = DispatchUtils.classifyResponse(
      statusCode = 200,
      retryAfterHeader = null,
      responseBody = body
    )
    assertEquals(DispatchResult.Success, result)
  }

  @Test
  fun `2xx with unparseable JSON body returns Success`() {
    // A garbage body on a 2xx response is not the server saying "rejected." Treat as success
    // — the bytes were accepted, the response is just non-conforming.
    val result = DispatchUtils.classifyResponse(
      statusCode = 200,
      retryAfterHeader = null,
      responseBody = "not even close to JSON"
    )
    assertEquals(DispatchResult.Success, result)
  }

  @Test
  fun `204 no content returns Success`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 204,
      retryAfterHeader = null,
      responseBody = null
    )
    assertEquals(DispatchResult.Success, result)
  }

  // MARK: -- Retryable per OTLP (408, 429, 502, 503, 504)

  @Test
  fun `429 returns Retryable with null retryAfter when no header`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 429,
      retryAfterHeader = null,
      responseBody = null
    )
    assertEquals(DispatchResult.Retryable(retryAfterMs = null), result)
  }

  @Test
  fun `429 with Retry-After seconds parses to milliseconds`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 429,
      retryAfterHeader = "30",
      responseBody = null
    )
    assertEquals(DispatchResult.Retryable(retryAfterMs = 30_000L), result)
  }

  @Test
  fun `503 propagates Retry-After`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 503,
      retryAfterHeader = "5",
      responseBody = null
    )
    assertEquals(DispatchResult.Retryable(retryAfterMs = 5_000L), result)
  }

  @Test
  fun `408 502 504 are all Retryable`() {
    for (code in intArrayOf(408, 502, 504)) {
      val result = DispatchUtils.classifyResponse(
        statusCode = code,
        retryAfterHeader = null,
        responseBody = null
      )
      assertTrue(
        "status $code should be Retryable, got $result",
        result is DispatchResult.Retryable
      )
    }
  }

  // MARK: -- Non-retryable 4xx / other 5xx

  @Test
  fun `400 returns NonRetryable with status and body excerpt`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 400,
      retryAfterHeader = null,
      responseBody = "bad request",
      bodyExcerpt = { "bad request" }
    )
    assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
    val reason = (result as DispatchResult.NonRetryable).reason
    assertTrue(reason.contains("400"))
    assertTrue(reason.contains("bad request"))
  }

  @Test
  fun `401 returns NonRetryable`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 401,
      retryAfterHeader = null,
      responseBody = null
    )
    assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
  }

  @Test
  fun `403 returns NonRetryable`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 403,
      retryAfterHeader = null,
      responseBody = null
    )
    assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
  }

  @Test
  fun `404 returns NonRetryable`() {
    val result = DispatchUtils.classifyResponse(
      statusCode = 404,
      retryAfterHeader = null,
      responseBody = null
    )
    assertTrue("expected NonRetryable, got $result", result is DispatchResult.NonRetryable)
  }

  @Test
  fun `500 is NonRetryable (not in OTLP retryable set)`() {
    // Only 502/503/504 are retryable in the 5xx range per the OTLP spec. 500 (and exotics
    // like 501, 505) describe a state we can't reason about without retrying ad infinitum.
    for (code in intArrayOf(500, 501, 505)) {
      val result = DispatchUtils.classifyResponse(
        statusCode = code,
        retryAfterHeader = null,
        responseBody = null
      )
      assertTrue(
        "status $code should be NonRetryable, got $result",
        result is DispatchResult.NonRetryable
      )
    }
  }

  @Test
  fun `bodyExcerpt closure is not invoked on Retryable status`() {
    // The excerpt closure is only useful for the NonRetryable log line. Verify the closure
    // isn't called on a 429 — we don't want to pay the cost of building a body excerpt for
    // every transient failure.
    var bodyClosureCalled = false
    DispatchUtils.classifyResponse(
      statusCode = 429,
      retryAfterHeader = null,
      responseBody = "ignored",
      bodyExcerpt = {
        bodyClosureCalled = true
        ""
      }
    )
    assertTrue("bodyExcerpt closure should not be called on 429", !bodyClosureCalled)
  }
}

class DispatchUtilsParseRetryAfterTest {
  @Test
  fun `null header returns null`() {
    assertNull(DispatchUtils.parseRetryAfter(null))
  }

  @Test
  fun `empty or whitespace header returns null`() {
    assertNull(DispatchUtils.parseRetryAfter(""))
    assertNull(DispatchUtils.parseRetryAfter("   "))
  }

  @Test
  fun `integer seconds parses to milliseconds`() {
    assertEquals(0L, DispatchUtils.parseRetryAfter("0"))
    assertEquals(30_000L, DispatchUtils.parseRetryAfter("30"))
    assertEquals(3_600_000L, DispatchUtils.parseRetryAfter("3600"))
  }

  @Test
  fun `negative seconds clamps to zero`() {
    // Defensive: a misbehaving server shouldn't be able to schedule the next dispatch in the
    // past (or, worse, give us a negative sleep).
    assertEquals(0L, DispatchUtils.parseRetryAfter("-1"))
  }

  @Test
  fun `fractional seconds parse`() {
    // RFC 7231 mandates integer delta-seconds; real servers sometimes emit decimals and
    // there's no harm in honoring them. 0.5 s → 500 ms.
    assertEquals(500L, DispatchUtils.parseRetryAfter("0.5"))
  }

  @Test
  fun `HTTP-date header parses to delta from injected now`() {
    val now = 1_700_000_000_000L  // fixed wall-clock for repeatability
    val futureMs = now + 60_000L
    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val header = formatter.format(Date(futureMs))

    val parsed = DispatchUtils.parseRetryAfter(header, now = now)
    assertNotNull(parsed)
    // SimpleDateFormat with second precision drops sub-second portions; allow ±1 s slop.
    assertTrue("expected ~60_000 ms, got $parsed", parsed!! in 59_000L..61_000L)
  }

  @Test
  fun `HTTP-date in the past clamps to zero`() {
    val now = 1_700_000_000_000L
    val pastMs = now - 3_600_000L
    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val header = formatter.format(Date(pastMs))

    assertEquals(0L, DispatchUtils.parseRetryAfter(header, now = now))
  }

  @Test
  fun `garbage header returns null`() {
    assertNull(DispatchUtils.parseRetryAfter("tomorrow morning"))
    assertNull(DispatchUtils.parseRetryAfter("Mon Jun 16"))
  }
}
