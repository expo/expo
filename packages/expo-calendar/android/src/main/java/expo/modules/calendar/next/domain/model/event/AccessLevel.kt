package expo.modules.calendar.next.domain.model.event

import android.provider.CalendarContract

enum class AccessLevel(val value: Int) {
  CONFIDENTIAL(CalendarContract.Events.ACCESS_CONFIDENTIAL),
  PRIVATE(CalendarContract.Events.ACCESS_PRIVATE),
  PUBLIC(CalendarContract.Events.ACCESS_PUBLIC),
  DEFAULT(CalendarContract.Events.ACCESS_DEFAULT);

  companion object {
    fun fromAndroidValue(value: Int): AccessLevel = when (value) {
      CalendarContract.Events.ACCESS_CONFIDENTIAL -> CONFIDENTIAL
      CalendarContract.Events.ACCESS_PRIVATE -> PRIVATE
      CalendarContract.Events.ACCESS_PUBLIC -> PUBLIC
      CalendarContract.Events.ACCESS_DEFAULT -> DEFAULT
      else -> DEFAULT
    }
  }
}
