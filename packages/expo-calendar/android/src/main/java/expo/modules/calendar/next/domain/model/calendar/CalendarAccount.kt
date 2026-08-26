package expo.modules.calendar.next.domain.model.calendar

/**
 * Account a calendar belongs to, as stored in `CalendarContract.Calendars`.
 *
 * Writes to the tables that only sync adapters may touch have to name the account they act for,
 * so this pair travels from the calendar down to those repositories.
 */
data class CalendarAccount(
  val name: String,
  val type: String
)
