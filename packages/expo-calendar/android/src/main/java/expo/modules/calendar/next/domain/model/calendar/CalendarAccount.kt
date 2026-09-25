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
) {
  /**
   * Whether Google Calendar syncs this account, whose adapter brings naming rules of its own that
   * the calendar provider does not impose.
   */
  val isGoogle get() = type == GOOGLE_TYPE

  companion object {
    const val GOOGLE_TYPE = "com.google"
  }
}
