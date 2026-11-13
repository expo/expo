package expo.modules.appmetrics

import expo.modules.appmetrics.storage.Span
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowLog

private const val TIMESTAMP_MS = 1_782_131_895_000L

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE, sdk = [28])
class SpanInputValidationTest {
  @Test
  fun `trims the span name`() {
    assertEquals("checkout", validatedSpanName("  checkout\n"))
  }

  @Test
  fun `rejects a span name that trims to empty`() {
    assertNull(validatedSpanName(""))
    assertNull(validatedSpanName(" \t "))
  }

  @Test
  fun `rejects the reserved expo prefix after trimming`() {
    assertNull(validatedSpanName("  expo.http"))
  }

  @Test
  fun `accepts span names that only resemble the reserved prefix`() {
    assertEquals("expoCheckout", validatedSpanName("expoCheckout"))
    assertEquals("expo", validatedSpanName("expo"))
  }

  @Test
  fun `accepts a span name at the length limit and rejects one past it`() {
    assertEquals(256, validatedSpanName("a".repeat(256))?.length)
    assertNull(validatedSpanName("a".repeat(257)))
  }

  @Test
  fun `measures the span name length after trimming`() {
    assertEquals(256, validatedSpanName(" " + "a".repeat(256) + " ")?.length)
  }

  @Test
  fun `maps span statuses to OTLP status codes`() {
    assertNull(spanStatusCode(null))
    assertEquals(Span.STATUS_OK, spanStatusCode("ok"))
    assertEquals(Span.STATUS_ERROR, spanStatusCode("error"))
  }

  @Test
  fun `rejects an unknown span status`() {
    assertNull(spanStatusCode("cancelled"))
    // Matching is case-sensitive, like the TypeScript union.
    assertNull(spanStatusCode("OK"))
  }

  @Test
  fun `truncates fractional milliseconds`() {
    assertEquals(TIMESTAMP_MS, unixMilliseconds(TIMESTAMP_MS + 0.9))
  }

  @Test
  fun `rejects non-finite timestamps`() {
    assertNull(unixMilliseconds(Double.NaN))
    assertNull(unixMilliseconds(Double.POSITIVE_INFINITY))
    assertNull(unixMilliseconds(Double.NEGATIVE_INFINITY))
  }

  @Test
  fun `rejects a timestamp past the 64-bit range`() {
    assertNull(unixMilliseconds(Long.MAX_VALUE.toDouble()))
  }

  @Test
  fun `rejects a timestamp from the wrong clock or in the wrong unit`() {
    // A `performance.now()` value measures uptime, and a timestamp in seconds is 1000 times too small.
    assertNull(unixMilliseconds(123_456.7))
    assertNull(unixMilliseconds(TIMESTAMP_MS / 1_000.0))
    assertNull(unixMilliseconds(0.0))
    assertNull(unixMilliseconds(-1.0))
  }

  @Test
  fun `rejects a timestamp in microseconds`() {
    assertNull(unixMilliseconds(TIMESTAMP_MS * 1_000.0))
  }

  @Test
  fun `accepts a timestamp up to one day after now`() {
    val oneDayMs = 24 * 60 * 60 * 1_000L
    assertEquals(TIMESTAMP_MS + oneDayMs, unixMilliseconds((TIMESTAMP_MS + oneDayMs).toDouble(), TIMESTAMP_MS))
    assertNull(unixMilliseconds((TIMESTAMP_MS + oneDayMs + 1).toDouble(), TIMESTAMP_MS))
  }

  @Test
  fun `accepts the earliest plausible timestamp`() {
    assertEquals(1_000_000_000_000L, unixMilliseconds(1_000_000_000_000.0))
  }

  @Test
  fun `resolves a usable timestamp to itself`() {
    assertEquals(TIMESTAMP_MS, resolvedTimestamp(TIMESTAMP_MS.toDouble(), "startTime"))
  }

  @Test
  fun `falls back to the current time for a missing or unusable timestamp`() {
    val before = System.currentTimeMillis()
    val missing = resolvedTimestamp(null, "startTime")
    val unusable = resolvedTimestamp(Double.NaN, "startTime")
    val after = System.currentTimeMillis()
    assertTrue(missing in before..after)
    assertTrue(unusable in before..after)
  }

  @Test
  fun `converts a required timestamp`() {
    assertEquals(TIMESTAMP_MS, requiredTimestamp(TIMESTAMP_MS.toDouble(), "startTime"))
  }

  @Test
  fun `rejects a missing required timestamp`() {
    assertNull(requiredTimestamp(null, "startTime"))
  }

  @Test
  fun `rejects an unusable required timestamp with a warning naming the field`() {
    assertNull(requiredTimestamp(123_456.7, "endTime"))
    assertTrue(ShadowLog.getLogsForTag(TAG).any { it.msg.contains("`endTime`") })
  }

  @Test
  fun `accepts a recordSpan window that ends when it starts`() {
    val window = recordedSpanWindow(TIMESTAMP_MS.toDouble(), TIMESTAMP_MS.toDouble())
    assertEquals(TIMESTAMP_MS to TIMESTAMP_MS, window)
  }

  @Test
  fun `rejects a recordSpan window that ends before it starts`() {
    assertNull(recordedSpanWindow(TIMESTAMP_MS.toDouble(), (TIMESTAMP_MS - 1).toDouble()))
  }

  @Test
  fun `rejects a recordSpan window with a missing time`() {
    assertNull(recordedSpanWindow(null, TIMESTAMP_MS.toDouble()))
  }

  @Test
  fun `falls back to the current time for a timestamp from the wrong clock`() {
    val before = System.currentTimeMillis()
    val resolved = resolvedTimestamp(123_456.7, "startTime")
    val after = System.currentTimeMillis()
    assertTrue(resolved in before..after)
  }
}
