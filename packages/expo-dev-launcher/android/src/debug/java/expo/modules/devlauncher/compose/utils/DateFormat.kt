package expo.modules.devlauncher.compose.utils

import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.format
import kotlinx.datetime.format.DateTimeComponents.Formats.ISO_DATE_TIME_OFFSET
import kotlinx.datetime.format.MonthNames
import kotlinx.datetime.toLocalDateTime
import kotlin.time.ExperimentalTime

object DateFormat {
  val updateDateFormat = LocalDateTime.Format {
    monthName(MonthNames.ENGLISH_ABBREVIATED)
    chars(" ")
    day()
    chars(", ")
    year()
    chars(", ")
    time(
      LocalTime.Format {
        amPmHour()
        chars(":")
        minute()
        amPmMarker("AM", "PM")
      }
    )
  }

  @OptIn(ExperimentalTime::class)
  fun formatUpdateDate(date: String?): String {
    return date ?.let {
      ISO_DATE_TIME_OFFSET
        .parse(it)
        .toInstantUsingOffset()
        .toLocalDateTime(TimeZone.currentSystemDefault())
        .format(updateDateFormat)
    } ?: "Unknown time"
  }
}
