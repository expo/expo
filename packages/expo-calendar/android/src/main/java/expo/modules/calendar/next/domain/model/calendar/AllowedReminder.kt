package expo.modules.calendar.next.domain.model.calendar

import android.provider.CalendarContract

enum class AllowedReminder(val value: Int) {
  ALARM(CalendarContract.Reminders.METHOD_ALARM),
  ALERT(CalendarContract.Reminders.METHOD_ALERT),
  DEFAULT(CalendarContract.Reminders.METHOD_DEFAULT),
  EMAIL(CalendarContract.Reminders.METHOD_EMAIL),
  SMS(CalendarContract.Reminders.METHOD_SMS)
}
