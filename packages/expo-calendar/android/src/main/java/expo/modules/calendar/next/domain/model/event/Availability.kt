package expo.modules.calendar.next.domain.model.event

import android.provider.CalendarContract

enum class Availability(val value: Int) {
  FREE(CalendarContract.Events.AVAILABILITY_FREE),
  TENTATIVE(CalendarContract.Events.AVAILABILITY_TENTATIVE),
  BUSY(CalendarContract.Events.AVAILABILITY_BUSY);

  companion object {
    fun fromAndroidValue(value: Int?): Availability = when (value) {
      CalendarContract.Events.AVAILABILITY_FREE -> FREE
      CalendarContract.Events.AVAILABILITY_TENTATIVE -> TENTATIVE
      CalendarContract.Events.AVAILABILITY_BUSY -> BUSY
      else -> BUSY
    }
  }
}
