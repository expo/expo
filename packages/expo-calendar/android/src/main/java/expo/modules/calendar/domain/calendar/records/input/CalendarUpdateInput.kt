package expo.modules.calendar.domain.calendar.records.input

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required

data class CalendarUpdateInput(
  @Field @Required val id: String,
  @Field val name: String?,
  @Field val title: String?,
  @Field val isVisible: Boolean?,
  @Field val isSynced: Boolean?
) : Record {
  fun toContentValues() = ContentValues().apply {
    name?.let { put(CalendarContract.Calendars.NAME, it) }
    title?.let { put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, it) }
    isVisible?.let { put(CalendarContract.Calendars.VISIBLE, it) }
    isSynced?.let { put(CalendarContract.Calendars.SYNC_EVENTS, it) }
  }
}
