package expo.modules.calendar.next.domain.model.attendee

import android.provider.CalendarContract

enum class AttendeeRole(val value: Int) {
  ATTENDEE(CalendarContract.Attendees.RELATIONSHIP_ATTENDEE),
  NONE(CalendarContract.Attendees.RELATIONSHIP_NONE),
  ORGANIZER(CalendarContract.Attendees.RELATIONSHIP_ORGANIZER),
  PERFORMER(CalendarContract.Attendees.RELATIONSHIP_PERFORMER),
  SPEAKER(CalendarContract.Attendees.RELATIONSHIP_SPEAKER)
}
