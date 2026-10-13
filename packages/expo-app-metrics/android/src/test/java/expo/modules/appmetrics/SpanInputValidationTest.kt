package expo.modules.appmetrics

import expo.modules.appmetrics.storage.Span
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

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
    assertThrows(EmptySpanNameException::class.java) { validatedSpanName("") }
    assertThrows(EmptySpanNameException::class.java) { validatedSpanName(" \t ") }
  }

  @Test
  fun `rejects the reserved expo prefix after trimming`() {
    assertThrows(ReservedSpanNameException::class.java) { validatedSpanName("  expo.http") }
  }

  @Test
  fun `accepts span names that only resemble the reserved prefix`() {
    assertEquals("expoCheckout", validatedSpanName("expoCheckout"))
    assertEquals("expo", validatedSpanName("expo"))
  }

  @Test
  fun `accepts a span name at the length limit and rejects one past it`() {
    assertEquals(256, validatedSpanName("a".repeat(256)).length)
    assertThrows(SpanNameTooLongException::class.java) { validatedSpanName("a".repeat(257)) }
  }

  @Test
  fun `measures the span name length after trimming`() {
    assertEquals(256, validatedSpanName(" " + "a".repeat(256) + " ").length)
  }

  @Test
  fun `maps span statuses to OTLP status codes`() {
    assertNull(spanStatusCode(null))
    assertEquals(Span.STATUS_OK, spanStatusCode("ok"))
    assertEquals(Span.STATUS_ERROR, spanStatusCode("error"))
  }

  @Test
  fun `rejects an unknown span status`() {
    assertThrows(InvalidSpanStatusException::class.java) { spanStatusCode("cancelled") }
    // Matching is case-sensitive, like the TypeScript union.
    assertThrows(InvalidSpanStatusException::class.java) { spanStatusCode("OK") }
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
    // `Long.MAX_VALUE.toDouble()` rounds up to 2^63, which no `Long` can hold.
    assertNull(unixMilliseconds(Long.MAX_VALUE.toDouble()))
    assertEquals(9_223_372_036_854_774_784L, unixMilliseconds(Math.nextDown(Long.MAX_VALUE.toDouble())))
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
    assertThrows(MissingSpanWindowException::class.java) { requiredTimestamp(null, "startTime") }
  }

  @Test
  fun `rejects an unusable required timestamp with an error naming the field`() {
    val error = assertThrows(InvalidSpanTimestampException::class.java) {
      requiredTimestamp(123_456.7, "endTime")
    }
    assertTrue(error.message.orEmpty().contains("`endTime`"))
  }

  @Test
  fun `falls back to the current time for a timestamp from the wrong clock`() {
    val before = System.currentTimeMillis()
    val resolved = resolvedTimestamp(123_456.7, "startTime")
    val after = System.currentTimeMillis()
    assertTrue(resolved in before..after)
  }
}
