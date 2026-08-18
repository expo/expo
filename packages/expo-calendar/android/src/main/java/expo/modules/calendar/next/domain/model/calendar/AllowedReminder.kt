package expo.modules.calendar.next.domain.model.calendar

import android.provider.CalendarContract

enum class AllowedReminder(val value: Int) {
  DEFAULT(CalendarContract.Reminders.METHOD_DEFAULT),
  ALERT(CalendarContract.Reminders.METHOD_ALERT),
  EMAIL(CalendarContract.Reminders.METHOD_EMAIL),
  SMS(CalendarContract.Reminders.METHOD_SMS),
  ALARM(CalendarContract.Reminders.METHOD_ALARM)
}
