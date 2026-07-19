package expo.modules.calendar.next.domain.model.attendee

import android.provider.CalendarContract

enum class AttendeeStatus(val value: Int) {
  ACCEPTED(CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED),
  DECLINED(CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED),
  INVITED(CalendarContract.Attendees.ATTENDEE_STATUS_INVITED),
  NONE(CalendarContract.Attendees.ATTENDEE_STATUS_NONE),
  TENTATIVE(CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE)
}
