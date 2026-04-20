package expo.modules.calendar.next.domain.model.calendar

import android.provider.CalendarContract

enum class AllowedAvailability(val value: Int) {
  BUSY(CalendarContract.Events.AVAILABILITY_BUSY),
  FREE(CalendarContract.Events.AVAILABILITY_FREE),
  TENTATIVE(CalendarContract.Events.AVAILABILITY_TENTATIVE)
}
