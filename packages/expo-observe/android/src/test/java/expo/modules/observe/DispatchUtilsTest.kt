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
  fun `429 with Retry-After inside client bounds is parsed as-is`() {
    // 120 s sits between base (60) and cap (900), so it propagates unchanged.
    val result = DispatchUtils.classifyResponse(
      statusCode = 429,
      retryAfterHeader = "120",
      responseBody = null
    )
    assertEquals(DispatchResult.Retryable(retryAfterMs = 120_000L), result)
  }

  @Test
  fun `503 Retry-After below base clamps up to base`() {
    // 5 s is below the 60 s floor — the client wouldn't dispatch faster than that anyway, so
    // honor the server's intent to slow down by snapping up to base.
    val result = DispatchUtils.classifyResponse(
      statusCode = 503,
      retryAfterHeader = "5",
      responseBody = null
    )
    assertEquals(DispatchResult.Retryable(retryAfterMs = DispatchUtils.backoffBaseMs), result)
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

class DispatchUtilsShouldRemovePendingTest {
  /// On `Success`, the queue moves past the dispatched batch so the next round reads only
  /// newer rows. Unchanged from the pre-OTLP behavior; locked here for the table.
  @Test
  fun `Success removes pending IDs`() {
    assertTrue(DispatchUtils.shouldRemovePending(DispatchResult.Success))
  }

  /// `Retryable` is the "leave them alone" case — the next dispatch round picks the same
  /// rows up again. This is what keeps an in-flight outage from losing telemetry.
  @Test
  fun `Retryable keeps pending IDs`() {
    assertTrue(!DispatchUtils.shouldRemovePending(DispatchResult.Retryable()))
    assertTrue(!DispatchUtils.shouldRemovePending(DispatchResult.Retryable(retryAfterMs = 30_000L)))
  }

  /// The acceptance-criterion behavior: a non-retryable response (e.g. 400, 403) drops the
  /// offending batch. Without this, the next round would re-send the same rows and the
  /// server would refuse them again, wedging the queue indefinitely.
  @Test
  fun `NonRetryable removes pending IDs`() {
    assertTrue(DispatchUtils.shouldRemovePending(DispatchResult.NonRetryable("HTTP 400")))
  }
}

class DispatchUtilsParseRetryAfterTest {
  // Test-local bounds passed explicitly to every call so the suite is independent of the
  // production constants. A separate test verifies the default-argument path.
  private val base: Long = 60_000L
  private val cap: Long = 900_000L

  // MARK: -- Missing / unparseable inputs return null (caller falls through to backoff)

  @Test
  fun `null header returns null`() {
    assertNull(DispatchUtils.parseRetryAfter(null, base = base, cap = cap))
  }

  @Test
  fun `empty or whitespace header returns null`() {
    assertNull(DispatchUtils.parseRetryAfter("", base = base, cap = cap))
    assertNull(DispatchUtils.parseRetryAfter("   ", base = base, cap = cap))
    assertNull(DispatchUtils.parseRetryAfter("\t\n", base = base, cap = cap))
  }

  @Test
  fun `garbage header returns null`() {
    // Neither a Long/Double nor an RFC 7231 HTTP-date — caller should fall through to backoff.
    val cases = listOf(
      "tomorrow morning",
      "Mon Jun 16",  // partial date, missing time + year + zone
      "30 minutes",  // delta-seconds doesn't accept units
      "30s",
      "abc",
      "300/600",
      ", 30",
      "30,"
    )
    for (header in cases) {
      assertNull(
        "expected null for garbage header \"$header\"",
        DispatchUtils.parseRetryAfter(header, base = base, cap = cap)
      )
    }
  }

  @Test
  fun `non-finite numeric tokens return null`() {
    // `toDoubleOrNull` accepts `Infinity` / `NaN` strings — but feeding either into the gate
    // deadline is a bug. Reject as garbage so the caller falls through to `computeBackoffDelay`,
    // which is bounded by construction.
    for (header in listOf("Infinity", "-Infinity", "NaN")) {
      assertNull(
        "expected null for non-finite numeric \"$header\"",
        DispatchUtils.parseRetryAfter(header, base = base, cap = cap)
      )
    }
  }

  // MARK: -- delta-seconds (numeric)

  @Test
  fun `delta-seconds inside base and cap returns the parsed value unchanged`() {
    assertEquals(60_000L, DispatchUtils.parseRetryAfter("60", base = base, cap = cap))
    assertEquals(120_000L, DispatchUtils.parseRetryAfter("120", base = base, cap = cap))
    assertEquals(900_000L, DispatchUtils.parseRetryAfter("900", base = base, cap = cap))
  }

  @Test
  fun `delta-seconds below base clamps up to base`() {
    // `Retry-After: 0` is the most common misbehavior — a server that wants us to retry
    // immediately. Snap to base so we don't hammer the recovering endpoint.
    assertEquals(base, DispatchUtils.parseRetryAfter("0", base = base, cap = cap))
    assertEquals(base, DispatchUtils.parseRetryAfter("1", base = base, cap = cap))
    assertEquals(base, DispatchUtils.parseRetryAfter("30", base = base, cap = cap))
    assertEquals(base, DispatchUtils.parseRetryAfter("0.5", base = base, cap = cap))
  }

  @Test
  fun `delta-seconds above cap clamps down to cap`() {
    // A pathological server response shouldn't be able to wedge us in a multi-hour snooze.
    assertEquals(cap, DispatchUtils.parseRetryAfter("901", base = base, cap = cap))
    assertEquals(cap, DispatchUtils.parseRetryAfter("3600", base = base, cap = cap))
    assertEquals(cap, DispatchUtils.parseRetryAfter("86400", base = base, cap = cap))
    assertEquals(cap, DispatchUtils.parseRetryAfter("1e9", base = base, cap = cap))
  }

  @Test
  fun `negative delta-seconds clamps up to base`() {
    // A negative delta would otherwise schedule the next dispatch in the past — bounce it to
    // the floor so the gate is still a real pause.
    assertEquals(base, DispatchUtils.parseRetryAfter("-1", base = base, cap = cap))
    assertEquals(base, DispatchUtils.parseRetryAfter("-3600", base = base, cap = cap))
  }

  @Test
  fun `leading and trailing whitespace is trimmed before parsing`() {
    assertEquals(120_000L, DispatchUtils.parseRetryAfter("  120  ", base = base, cap = cap))
    assertEquals(120_000L, DispatchUtils.parseRetryAfter("\n120\t", base = base, cap = cap))
  }

  // MARK: -- HTTP-date

  @Test
  fun `HTTP-date inside bounds parses to a delta near the actual offset`() {
    // Build a header 5 minutes (300 s) in the future — comfortably inside [60, 900].
    val now = 1_700_000_000_000L
    val futureMs = now + 300_000L
    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val header = formatter.format(Date(futureMs))

    val parsed = DispatchUtils.parseRetryAfter(header, base = base, cap = cap, now = now)
    assertNotNull(parsed)
    assertTrue("expected ~300_000 ms, got $parsed", parsed!! in 295_000L..305_000L)
  }

  @Test
  fun `HTTP-date in the past clamps up to base`() {
    val now = 1_700_000_000_000L
    val pastMs = now - 3_600_000L
    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val header = formatter.format(Date(pastMs))

    assertEquals(base, DispatchUtils.parseRetryAfter(header, base = base, cap = cap, now = now))
  }

  @Test
  fun `HTTP-date far in the future clamps down to cap`() {
    // Two hours from now is well past the 15-minute cap.
    val now = 1_700_000_000_000L
    val farFutureMs = now + 7_200_000L
    val formatter = SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss zzz", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("GMT")
    val header = formatter.format(Date(farFutureMs))

    assertEquals(cap, DispatchUtils.parseRetryAfter(header, base = base, cap = cap, now = now))
  }

  // MARK: -- Custom client bounds

  @Test
  fun `custom base and cap override the defaults`() {
    // The same input ("100") clamps differently depending on the bounds passed in: with the
    // default [60 s, 900 s] it sits inside, but a stricter [120 s, 600 s] window snaps it up
    // to 120 s.
    assertEquals(100_000L, DispatchUtils.parseRetryAfter("100"))
    assertEquals(120_000L, DispatchUtils.parseRetryAfter("100", base = 120_000L, cap = 600_000L))
    assertEquals(50_000L, DispatchUtils.parseRetryAfter("100", base = 10_000L, cap = 50_000L))
  }
}
