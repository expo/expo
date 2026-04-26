package expo.modules.calendar.next.domain.repositories.attendee

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.attendee.AttendeeEntity
import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.repositories.getOptionalInt
import expo.modules.calendar.next.domain.repositories.getOptionalLong
import expo.modules.calendar.next.domain.repositories.getOptionalString
import expo.modules.calendar.next.domain.wrappers.AttendeeId

fun Cursor.toAttendeeEntity() = AttendeeEntity(
  id = AttendeeId(
    getOptionalLong(CalendarContract.Attendees._ID)
      ?: throw IllegalStateException("attendee ID must not be null")
  ),
  email = getString(getColumnIndexOrThrow(CalendarContract.Attendees.ATTENDEE_EMAIL)),
  name = getOptionalString(CalendarContract.Attendees.ATTENDEE_NAME),
  role = getOptionalInt(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)?.let { value ->
    AttendeeRole.entries.find { it.value == value }
  },
  status = getOptionalInt(CalendarContract.Attendees.ATTENDEE_STATUS)?.let { value ->
    AttendeeStatus.entries.find { it.value == value }
  },
  type = getOptionalInt(CalendarContract.Attendees.ATTENDEE_TYPE)?.let { value ->
    AttendeeType.entries.find { it.value == value }
  }
)
