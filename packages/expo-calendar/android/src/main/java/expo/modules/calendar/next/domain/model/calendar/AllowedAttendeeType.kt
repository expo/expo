package expo.modules.calendar.next.domain.model.calendar

import android.provider.CalendarContract

enum class AllowedAttendeeType(val value: Int) {
  NONE(CalendarContract.Attendees.TYPE_NONE),
  REQUIRED(CalendarContract.Attendees.TYPE_REQUIRED),
  OPTIONAL(CalendarContract.Attendees.TYPE_OPTIONAL),
  RESOURCE(CalendarContract.Attendees.TYPE_RESOURCE)
}
