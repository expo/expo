package expo.modules.calendar.domain.attendee.extensions

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.domain.attendee.enums.AttendeeRole
import expo.modules.calendar.domain.attendee.enums.AttendeeStatus
import expo.modules.calendar.domain.attendee.enums.AttendeeType
import expo.modules.calendar.domain.attendee.records.Attendee
import expo.modules.calendar.extensions.getIntOrDefault
import expo.modules.calendar.extensions.getOptionalString
import expo.modules.calendar.extensions.getRequiredString

fun Cursor.extractAttendee(): Attendee {
  val roleValue = getIntOrDefault(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)
  val typeValue = getIntOrDefault(CalendarContract.Attendees.ATTENDEE_TYPE)
  val statusValue = getIntOrDefault(CalendarContract.Attendees.ATTENDEE_STATUS)
  return Attendee(
    id = getOptionalString(CalendarContract.Attendees._ID),
    name = getRequiredString(CalendarContract.Attendees.ATTENDEE_NAME),
    email = getOptionalString(CalendarContract.Attendees.ATTENDEE_EMAIL),
    role = AttendeeRole.fromContentProviderValue(roleValue),
    type = AttendeeType.fromContentProviderValue(typeValue),
    status = AttendeeStatus.fromContentProviderValue(statusValue)
  )
}
