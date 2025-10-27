package expo.modules.calendar.domain.attendee.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class AttendeeType(val value: String) : Enumerable {
  OPTIONAL("optional"),
  REQUIRED("required"),
  RESOURCE("resource"),
  NONE("none");

  val contentProviderValue
    get() = when (this) {
      OPTIONAL -> CalendarContract.Attendees.TYPE_OPTIONAL
      REQUIRED -> CalendarContract.Attendees.TYPE_REQUIRED
      RESOURCE -> CalendarContract.Attendees.TYPE_RESOURCE
      else -> CalendarContract.Attendees.TYPE_NONE
    }

  companion object {
    /**
     * @param constant value from `CalendarContract.Attendees.TYPE_*`
     */
    fun fromContentProviderValue(constant: Int): AttendeeType =
      when (constant) {
        CalendarContract.Attendees.TYPE_OPTIONAL -> OPTIONAL
        CalendarContract.Attendees.TYPE_REQUIRED -> REQUIRED
        CalendarContract.Attendees.TYPE_RESOURCE -> RESOURCE
        CalendarContract.Attendees.TYPE_NONE -> NONE
        else -> NONE
      }

    fun fromString(stringValue: String): AttendeeType =
      entries.find { it.value == stringValue } ?: NONE
  }
}
