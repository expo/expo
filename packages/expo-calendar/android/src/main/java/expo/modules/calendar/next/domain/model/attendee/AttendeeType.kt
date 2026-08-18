package expo.modules.calendar.next.domain.model.attendee

import android.provider.CalendarContract

enum class AttendeeType(val value: Int) {
  NONE(CalendarContract.Attendees.TYPE_NONE),
  OPTIONAL(CalendarContract.Attendees.TYPE_OPTIONAL),
  REQUIRED(CalendarContract.Attendees.TYPE_REQUIRED),
  RESOURCE(CalendarContract.Attendees.TYPE_RESOURCE)
}
