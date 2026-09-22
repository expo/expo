package expo.modules.devlauncher.compose.utils

import android.text.format.DateUtils
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.format
import kotlinx.datetime.format.DateTimeComponents.Formats.ISO_DATE_TIME_OFFSET
import kotlinx.datetime.format.MonthNames
import kotlinx.datetime.toLocalDateTime
import kotlin.time.ExperimentalTime

object DateFormat {
  /**
   * Updates published within this window read as "2 hr. ago"; anything older reads as an
   * absolute date, since "8 mo. ago" stops being useful for telling old updates apart.
   */
  private val relativeCutoffMillis = 7 * DateUtils.DAY_IN_MILLIS

  private val absoluteDateFormat = LocalDate.Format {
    monthName(MonthNames.ENGLISH_ABBREVIATED)
    chars(" ")
    day()
    chars(", ")
    year()
  }

  @OptIn(ExperimentalTime::class)
  fun formatUpdateDate(date: String?, now: Long = System.currentTimeMillis()): String {
    val instant = date?.let {
      runCatching { ISO_DATE_TIME_OFFSET.parse(it).toInstantUsingOffset() }.getOrNull()
    } ?: return "Unknown time"

    val timestamp = instant.toEpochMilliseconds()

    if (now - timestamp >= relativeCutoffMillis) {
      return instant
        .toLocalDateTime(TimeZone.currentSystemDefault())
        .date
        .format(absoluteDateFormat)
    }

    return DateUtils.getRelativeTimeSpanString(
      timestamp,
      now,
      DateUtils.MINUTE_IN_MILLIS,
      DateUtils.FORMAT_ABBREV_RELATIVE
    ).toString()
  }
}
