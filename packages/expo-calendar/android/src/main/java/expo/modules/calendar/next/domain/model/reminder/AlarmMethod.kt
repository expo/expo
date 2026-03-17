package expo.modules.calendar.next.domain.model.reminder

import android.provider.CalendarContract

enum class AlarmMethod(val value: Int) {
  ALARM(CalendarContract.Reminders.METHOD_ALARM),
  ALERT(CalendarContract.Reminders.METHOD_ALERT),
  EMAIL(CalendarContract.Reminders.METHOD_EMAIL),
  SMS(CalendarContract.Reminders.METHOD_SMS),
  DEFAULT(CalendarContract.Reminders.METHOD_DEFAULT)
}
