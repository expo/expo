package expo.modules.calendar.domain.event.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class AlarmMethod(val value: String) : Enumerable {
  ALARM("alarm"),
  ALERT("alert"),
  EMAIL("email"),
  SMS("sms"),
  DEFAULT("default");

  val contentProviderValue: Int
    get() = when (this) {
      ALARM -> CalendarContract.Reminders.METHOD_ALARM
      ALERT -> CalendarContract.Reminders.METHOD_ALERT
      EMAIL -> CalendarContract.Reminders.METHOD_EMAIL
      SMS -> CalendarContract.Reminders.METHOD_SMS
      else -> CalendarContract.Reminders.METHOD_DEFAULT
    }

  companion object {
    fun fromContentProviderValue(constant: Int): AlarmMethod =
      when (constant) {
        CalendarContract.Reminders.METHOD_ALARM -> ALARM
        CalendarContract.Reminders.METHOD_ALERT -> ALERT
        CalendarContract.Reminders.METHOD_EMAIL -> EMAIL
        CalendarContract.Reminders.METHOD_SMS -> SMS
        CalendarContract.Reminders.METHOD_DEFAULT -> DEFAULT
        else -> DEFAULT
      }
  }
}
