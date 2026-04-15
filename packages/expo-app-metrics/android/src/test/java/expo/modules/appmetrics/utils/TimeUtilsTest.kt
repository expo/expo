package expo.modules.appmetrics.utils

import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowSystemClock
import java.text.SimpleDateFormat
import java.util.*

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class TimeUtilsTest {
  @Test
  fun `getCurrentTimeInMillis returns non-zero value`() {
    // Given
    ShadowSystemClock.advanceBy(java.time.Duration.ofMillis(10))
    // When
    val currentTime = TimeUtils.getCurrentTimeInMillis()

    // Then
    assertTrue("Current time should be greater than 0", currentTime > 0)
  }

  @Test
  fun `getCurrentTimeInMillis returns monotonically increasing values`() {
    // Given
    val time1 = TimeUtils.getCurrentTimeInMillis()

    // When
    // Advance the system clock in Robolectric
    ShadowSystemClock.advanceBy(java.time.Duration.ofMillis(10))
    val time2 = TimeUtils.getCurrentTimeInMillis()

    // Then
    assertTrue("Second time should be greater than first time", time2 > time1)
  }

  @Test
  fun `getProcessStartTimeInMillis returns zero value`() {
    // Given
    ShadowSystemClock.advanceBy(java.time.Duration.ofMillis(10))
    // When
    val startTime = TimeUtils.getProcessStartTimeInMillis()

    // Then
    assertTrue("Process start time should be equal to 0", startTime == 0L)
  }

  @Test
  fun `getProcessStartTimeInMillis returns consistent value`() {
    // Given
    val startTime1 = TimeUtils.getProcessStartTimeInMillis()

    // When
    Thread.sleep(10)
    val startTime2 = TimeUtils.getProcessStartTimeInMillis()

    // Then
    assertEquals("Process start time should remain constant", startTime1, startTime2)
  }

  @Test
  fun `getProcessStartTimeInMillis is less than or equal to current time`() {
    // Given & When
    val startTime = TimeUtils.getProcessStartTimeInMillis()
    val currentTime = TimeUtils.getCurrentTimeInMillis()

    // Then
    assertTrue(
      "Process start time should be less than or equal to current time",
      startTime <= currentTime
    )
  }

  @Test
  fun `getCurrentTimestampInISOFormat returns valid ISO 8601 format`() {
    // Given & When
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()

    // Then
    // Verify it matches the ISO 8601 format pattern: yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
    val isoPattern = Regex("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z")
    assertTrue(
      "Timestamp should match ISO 8601 format",
      isoPattern.matches(timestamp)
    )
  }

  @Test
  fun `getCurrentTimestampInISOFormat ends with Z indicating UTC`() {
    // Given & When
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()

    // Then
    assertTrue("Timestamp should end with 'Z' for UTC", timestamp.endsWith("Z"))
  }

  @Test
  fun `getCurrentTimestampInISOFormat is parseable`() {
    // Given
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    sdf.timeZone = TimeZone.getTimeZone("UTC")

    // When
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()

    // Then
    try {
      val parsedDate = sdf.parse(timestamp)
      assertNotNull("Timestamp should be parseable", parsedDate)
    } catch (e: Exception) {
      fail("Timestamp should be parseable without exceptions: ${e.message}")
    }
  }

  @Test
  fun `getCurrentTimestampInISOFormat returns current time within reasonable range`() {
    // Given
    val beforeMillis = System.currentTimeMillis()

    // When
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()

    // Then
    val afterMillis = System.currentTimeMillis()

    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    sdf.timeZone = TimeZone.getTimeZone("UTC")
    val parsedDate = sdf.parse(timestamp)

    assertTrue(
      "Timestamp should be within the time range of the test execution",
      parsedDate.time >= beforeMillis && parsedDate.time <= afterMillis
    )
  }

  @Test
  fun `getCurrentTimestampInISOFormat returns different timestamps for different calls`() {
    // Given
    val timestamp1 = TimeUtils.getCurrentTimestampInISOFormat()

    // When
    Thread.sleep(10) // Ensure some time passes
    val timestamp2 = TimeUtils.getCurrentTimestampInISOFormat()

    // Then
    assertNotEquals(
      "Two timestamps taken at different times should be different",
      timestamp1,
      timestamp2
    )
  }

  @Test
  fun `getCurrentTimestampInISOFormat uses UTC timezone`() {
    // Given
    val timestamp = TimeUtils.getCurrentTimestampInISOFormat()

    // When
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    sdf.timeZone = TimeZone.getTimeZone("UTC")
    val parsedDate = sdf.parse(timestamp)

    val calendar = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
    calendar.time = parsedDate

    // Then
    // Verify that when we parse with UTC, it doesn't throw an exception
    // and the parsed date is reasonable (within last 10 years)
    val tenYearsAgo = System.currentTimeMillis() - (10L * 365 * 24 * 60 * 60 * 1000)
    assertTrue(
      "Parsed timestamp should be a reasonable date (not ancient)",
      parsedDate.time > tenYearsAgo
    )
  }
}
