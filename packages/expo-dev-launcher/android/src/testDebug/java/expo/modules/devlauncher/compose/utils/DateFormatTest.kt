package expo.modules.devlauncher.compose.utils

import com.google.common.truth.Truth
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

@OptIn(ExperimentalTime::class)
@RunWith(RobolectricTestRunner::class)
internal class DateFormatTest {
  private val now = Instant.parse("2025-09-22T12:00:00Z").toEpochMilliseconds()

  @Test
  fun `formats a recent update relatively`() {
    val formatted = DateFormat.formatUpdateDate("2025-09-22T10:00:00.000Z", now)

    Truth.assertThat(formatted).contains("ago")
  }

  @Test
  fun `formats an update just under a week old relatively`() {
    val formatted = DateFormat.formatUpdateDate("2025-09-16T12:00:00.000Z", now)

    Truth.assertThat(formatted).contains("ago")
  }

  @Test
  fun `formats an update older than a week as an absolute date`() {
    val formatted = DateFormat.formatUpdateDate("2025-09-14T12:00:00.000Z", now)

    Truth.assertThat(formatted).isEqualTo("Sep 14, 2025")
  }

  @Test
  fun `formats an update without fractional seconds`() {
    val formatted = DateFormat.formatUpdateDate("2025-09-14T12:00:00Z", now)

    Truth.assertThat(formatted).isEqualTo("Sep 14, 2025")
  }

  @Test
  fun `returns a fallback when the date is missing`() {
    Truth.assertThat(DateFormat.formatUpdateDate(null, now)).isEqualTo("Unknown time")
  }

  @Test
  fun `returns a fallback when the date cannot be parsed`() {
    Truth.assertThat(DateFormat.formatUpdateDate("not a date", now)).isEqualTo("Unknown time")
  }
}
