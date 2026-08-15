package expo.modules.calendar.next.domain.model.calendar

import android.provider.CalendarContract

enum class CalendarAccessLevel(val value: Int) {
  CONTRIBUTOR(CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR),
  EDITOR(CalendarContract.Calendars.CAL_ACCESS_EDITOR),
  FREEBUSY(CalendarContract.Calendars.CAL_ACCESS_FREEBUSY),
  NONE(CalendarContract.Calendars.CAL_ACCESS_NONE),
  OVERRIDE(CalendarContract.Calendars.CAL_ACCESS_OVERRIDE),
  OWNER(CalendarContract.Calendars.CAL_ACCESS_OWNER),
  READ(CalendarContract.Calendars.CAL_ACCESS_READ),
  RESPOND(CalendarContract.Calendars.CAL_ACCESS_RESPOND),
  ROOT(CalendarContract.Calendars.CAL_ACCESS_ROOT)
}
