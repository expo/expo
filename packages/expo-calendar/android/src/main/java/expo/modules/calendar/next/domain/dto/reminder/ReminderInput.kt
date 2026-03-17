package expo.modules.calendar.next.domain.dto.reminder

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.reminder.AlarmMethod
import expo.modules.calendar.next.domain.wrappers.EventId

class ReminderInput(
  val method: AlarmMethod? = null,
  val minutes: Int
) {
  fun toContentValues(eventId: EventId) = ContentValues().apply {
    put(CalendarContract.Reminders.EVENT_ID, eventId.value)
    put(CalendarContract.Reminders.METHOD, method?.value ?: CalendarContract.Reminders.METHOD_DEFAULT)
    put(CalendarContract.Reminders.MINUTES, minutes)
  }
}
