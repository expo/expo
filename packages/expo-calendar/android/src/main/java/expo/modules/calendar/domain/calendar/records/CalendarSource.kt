package expo.modules.calendar.domain.calendar.records

import android.provider.CalendarContract
import expo.modules.calendar.exceptions.FieldMissingException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * This is used for both input and return type
 * - When used as input:
 *   - name is required
 *   - either `type` is required or `isLocalAccount` must be true
 * - When returning to JS, none field is required
 *   - `isLocalAccount` is inferred based on `type`
 */
class CalendarSource : Record {
  constructor(name: String?, type: String?) {
    this.name = name
    this.type = type
    this.jsIsLocalAccount = type == CalendarContract.ACCOUNT_TYPE_LOCAL
  }

  @Field val name: String?

  @Field val type: String?

  @Field(key = "isLocalAccount")
  private val jsIsLocalAccount: Boolean?

  val isLocalAccount: Boolean
    get() = jsIsLocalAccount ?: false

  val resolvedType: String?
    get() = if (isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else type

  fun assertValidForNewCalendar() {
    if (name == null) {
      throw FieldMissingException("new calendars require a `source` object with a `name`")
    }
    if (type == null && !isLocalAccount) {
      throw FieldMissingException("new calendars require a `source` object with a `type`, or `isLocalAccount`: true")
    }
  }
}
