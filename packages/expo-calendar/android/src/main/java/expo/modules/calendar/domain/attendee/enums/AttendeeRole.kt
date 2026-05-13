package expo.modules.calendar.domain.attendee.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class AttendeeRole(val value: String) : Enumerable {
  ATTENDEE("attendee"),
  ORGANIZER("organizer"),
  PERFORMER("performer"),
  SPEAKER("speaker"),
  NONE("none");

  val contentProviderValue
    get() =
      when (this) {
        ATTENDEE -> CalendarContract.Attendees.RELATIONSHIP_ATTENDEE
        ORGANIZER -> CalendarContract.Attendees.RELATIONSHIP_ORGANIZER
        PERFORMER -> CalendarContract.Attendees.RELATIONSHIP_PERFORMER
        SPEAKER -> CalendarContract.Attendees.RELATIONSHIP_SPEAKER
        NONE -> CalendarContract.Attendees.RELATIONSHIP_NONE
      }

  companion object {
    /**
     * @param constant value from `CalendarContract.Attendees.RELATIONSHIP_*`
     */
    fun fromContentProviderValue(constant: Int): AttendeeRole =
      when (constant) {
        CalendarContract.Attendees.RELATIONSHIP_ATTENDEE -> ATTENDEE
        CalendarContract.Attendees.RELATIONSHIP_ORGANIZER -> ORGANIZER
        CalendarContract.Attendees.RELATIONSHIP_PERFORMER -> PERFORMER
        CalendarContract.Attendees.RELATIONSHIP_SPEAKER -> SPEAKER
        CalendarContract.Attendees.RELATIONSHIP_NONE -> NONE
        else -> NONE
      }

    fun fromString(stringValue: String): AttendeeRole =
      entries.find { it.value == stringValue } ?: NONE
  }
}
