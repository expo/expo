package expo.modules.calendar.next.domain.repositories.reminder

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.reminder.Method
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.repositories.getOptionalInt
import expo.modules.calendar.next.domain.repositories.getOptionalLong
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ReminderId

fun Cursor.toReminderEntity(eventId: EventId) = ReminderEntity(
  id = ReminderId(
    getOptionalLong(CalendarContract.Reminders._ID)
      ?: throw IllegalStateException("reminder ID must not be null")
  ),
  eventId = eventId,
  method = getOptionalInt(CalendarContract.Reminders.METHOD)?.let { value ->
    Method.entries.find { it.value == value }
  },
  minutes = getOptionalInt(CalendarContract.Reminders.MINUTES)
    ?: throw IllegalStateException("reminder minutes must not be null")
)
