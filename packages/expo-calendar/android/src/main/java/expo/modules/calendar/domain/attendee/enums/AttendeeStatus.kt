package expo.modules.calendar.domain.attendee.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class AttendeeStatus(val value: String) : Enumerable {
  ACCEPTED("accepted"),
  DECLINED("declined"),
  INVITED("invited"),
  TENTATIVE("tentative"),
  NONE("none");

  companion object {
    /**
     * @param constant value from `CalendarContract.Attendees.ATTENDE_STATUS_*`
     */
    fun fromContentProviderValue(constant: Int): AttendeeStatus =
      when (constant) {
        CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED -> ACCEPTED
        CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED -> DECLINED
        CalendarContract.Attendees.ATTENDEE_STATUS_INVITED -> INVITED
        CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE -> TENTATIVE
        CalendarContract.Attendees.ATTENDEE_STATUS_NONE -> NONE
        else -> NONE
      }

    fun fromString(stringValue: String): AttendeeStatus =
      entries.find { it.value == stringValue } ?: NONE
  }

  val contentProviderValue
    get() = when (this) {
      ACCEPTED -> CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED
      DECLINED -> CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED
      INVITED -> CalendarContract.Attendees.ATTENDEE_STATUS_INVITED
      TENTATIVE -> CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE
      else -> CalendarContract.Attendees.ATTENDEE_STATUS_NONE
    }
}
