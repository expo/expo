package expo.modules.calendar.next

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject

@OptIn(EitherType::class)
class ExpoCalendar : SharedObject {
  val id: String?
  val title: String?
  private val contentResolver
    get() = (appContext?.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

  constructor(id: String) {
    this.id = id
    this.title = null
  }

  constructor(cursor: Cursor) {
    this.id = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars._ID)
    this.title = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)
  }

  fun getEvents(startDate: Any, endDate: Any): List<ExpoCalendarEvent> {
    if (id == null) {
      throw Exception("Calendar id is null")
    }
    val cursor = CalendarUtils.findEvents(contentResolver, startDate, endDate, listOf(id))
    return cursor.use { serializeExpoCalendarEvents(cursor) }
  }

  private fun serializeExpoCalendarEvents(cursor: Cursor): List<ExpoCalendarEvent> {
    val results: MutableList<ExpoCalendarEvent> = ArrayList()
    while (cursor.moveToNext()) {
      results.add(ExpoCalendarEvent(cursor))
    }
    return results
  }
}
