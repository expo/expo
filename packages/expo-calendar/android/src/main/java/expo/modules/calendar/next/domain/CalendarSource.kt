package expo.modules.calendar.next.domain

import android.provider.CalendarContract

data class CalendarSource(
  val name: String?,
  val type: String?
) {
  val isLocalAccount: Boolean
    get() = type == CalendarContract.ACCOUNT_TYPE_LOCAL

  val resolvedType: String?
    get() = if (isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else type

  fun assertValidForNewCalendar() {
    requireNotNull(name) { "new calendars require a `source` object with a `name`" }
    require(type != null || isLocalAccount) { "new calendars require a `source` object with a `type`, or `isLocalAccount`: true" }
  }
}
