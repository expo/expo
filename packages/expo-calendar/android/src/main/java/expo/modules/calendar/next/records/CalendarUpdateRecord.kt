package expo.modules.calendar.next.records

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.ValueOrUndefined

data class CalendarUpdateRecord(
  @Field val name: ValueOrUndefined<String?> = ValueOrUndefined.Undefined(),
  @Field val title: ValueOrUndefined<String> = ValueOrUndefined.Undefined(),
  @Field val color: ValueOrUndefined<Int> = ValueOrUndefined.Undefined(),
  @Field val isVisible: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val isSynced: ValueOrUndefined<Boolean?> = ValueOrUndefined.Undefined(),
  @Field val timeZone: ValueOrUndefined<String?> = ValueOrUndefined.Undefined()
) : Record {
  fun toContentValues() = ContentValues().apply {
    if (!name.isUndefined) {
      put(CalendarContract.Calendars.NAME, name.optional)
    }
    if (!title.isUndefined) {
      put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, title.optional)
    }
    if (!color.isUndefined) {
      put(CalendarContract.Calendars.CALENDAR_COLOR, color.optional)
    }
    if (!isVisible.isUndefined) {
      put(CalendarContract.Calendars.VISIBLE, isVisible.optional)
    }
    if (!isSynced.isUndefined) {
      put(CalendarContract.Calendars.SYNC_EVENTS, isSynced.optional)
    }
    if (!timeZone.isUndefined) {
      put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, timeZone.optional)
    }
  }
}
