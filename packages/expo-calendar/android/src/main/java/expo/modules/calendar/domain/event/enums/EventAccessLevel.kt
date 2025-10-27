package expo.modules.calendar.domain.event.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class EventAccessLevel(val value: String) : Enumerable {
  CONFIDENTIAL("confidential"),
  PRIVATE("private"),
  PUBLIC("public"),
  DEFAULT("default");

  val contentProviderValue: Int get() =
    when (this) {
      CONFIDENTIAL -> CalendarContract.Events.ACCESS_CONFIDENTIAL
      PRIVATE -> CalendarContract.Events.ACCESS_PRIVATE
      PUBLIC -> CalendarContract.Events.ACCESS_PUBLIC
      else -> CalendarContract.Events.ACCESS_DEFAULT
    }

  companion object {
    fun fromString(value: String): EventAccessLevel =
      entries.find { it.value == value } ?: DEFAULT

    fun fromContentProviderValue(constant: Int): EventAccessLevel =
      when (constant) {
        CalendarContract.Events.ACCESS_CONFIDENTIAL -> CONFIDENTIAL
        CalendarContract.Events.ACCESS_PRIVATE -> PRIVATE
        CalendarContract.Events.ACCESS_PUBLIC -> PUBLIC
        CalendarContract.Events.ACCESS_DEFAULT -> DEFAULT
        else -> DEFAULT
      }
  }
}
