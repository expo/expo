package expo.modules.calendar.next.domain.model.event

import android.provider.CalendarContract

enum class Status(val value: Int) {
  CONFIRMED(CalendarContract.Events.STATUS_CONFIRMED),
  TENTATIVE(CalendarContract.Events.STATUS_TENTATIVE),
  CANCELED(CalendarContract.Events.STATUS_CANCELED)
}
