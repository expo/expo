package expo.modules.calendar.next.domain

import android.provider.CalendarContract

enum class AttendeeType(val value: String) {
  OPTIONAL("optional"),
  REQUIRED("required"),
  RESOURCE("resource"),
  NONE("none");

  val contentProviderValue: Int
    get() = when (this) {
      OPTIONAL -> CalendarContract.Attendees.TYPE_OPTIONAL
      REQUIRED -> CalendarContract.Attendees.TYPE_REQUIRED
      RESOURCE -> CalendarContract.Attendees.TYPE_RESOURCE
      else -> CalendarContract.Attendees.TYPE_NONE
    }

  companion object {
    fun fromContentProviderValue(constant: Int): AttendeeType =
      when (constant) {
        CalendarContract.Attendees.TYPE_OPTIONAL -> OPTIONAL
        CalendarContract.Attendees.TYPE_REQUIRED -> REQUIRED
        CalendarContract.Attendees.TYPE_RESOURCE -> RESOURCE
        CalendarContract.Attendees.TYPE_NONE -> NONE
        else -> NONE
      }

    fun fromString(value: String): AttendeeType =
      entries.find { it.value == value } ?: NONE
  }
}
