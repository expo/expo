package expo.modules.calendar.domain.calendar.enums

import android.provider.CalendarContract
import expo.modules.kotlin.types.Enumerable

enum class CalendarAccessLevel(val value: String) : Enumerable {
  CONTRIBUTOR("contributor"),
  EDITOR("editor"),
  FREEBUSY("freebusy"),
  OVERRIDE("override"),
  OWNER("owner"),
  READ("read"),
  RESPOND("respond"),
  ROOT("root"),
  NONE("none");

  val contentProviderValue: Int
    get() =
      when (this) {
        CONTRIBUTOR -> CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
        EDITOR -> CalendarContract.Calendars.CAL_ACCESS_EDITOR
        FREEBUSY -> CalendarContract.Calendars.CAL_ACCESS_FREEBUSY
        OVERRIDE -> CalendarContract.Calendars.CAL_ACCESS_OVERRIDE
        OWNER -> CalendarContract.Calendars.CAL_ACCESS_OWNER
        READ -> CalendarContract.Calendars.CAL_ACCESS_READ
        RESPOND -> CalendarContract.Calendars.CAL_ACCESS_RESPOND
        ROOT -> CalendarContract.Calendars.CAL_ACCESS_ROOT
        else -> CalendarContract.Calendars.CAL_ACCESS_NONE
      }

  companion object {
    fun fromContentProviderValue(constant: Int): CalendarAccessLevel =
      when (constant) {
        CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR -> CONTRIBUTOR
        CalendarContract.Calendars.CAL_ACCESS_EDITOR -> EDITOR
        CalendarContract.Calendars.CAL_ACCESS_FREEBUSY -> FREEBUSY
        CalendarContract.Calendars.CAL_ACCESS_OVERRIDE -> OVERRIDE
        CalendarContract.Calendars.CAL_ACCESS_OWNER -> OWNER
        CalendarContract.Calendars.CAL_ACCESS_READ -> READ
        CalendarContract.Calendars.CAL_ACCESS_RESPOND -> RESPOND
        CalendarContract.Calendars.CAL_ACCESS_ROOT -> ROOT
        CalendarContract.Calendars.CAL_ACCESS_NONE -> NONE
        else -> NONE
      }
  }
}
