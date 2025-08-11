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
  val isPrimary: Boolean
  val name: String?
  val color: String?
  val ownerAccount: String?
  val timeZone: String?
  val isVisible: Boolean
  val isSynced: Boolean
  val allowsModifications: Boolean
  val cursor: Cursor?
  private val contentResolver
    get() = (appContext?.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

  constructor(id: String) {
    this.id = id
    this.title = null
    this.isPrimary = false
    this.name = null
    this.color = null
    this.ownerAccount = null
    this.timeZone = null
    this.isVisible = false
    this.isSynced = false
    this.allowsModifications = false
    this.cursor = null
  }

  constructor(cursor: Cursor) {
    this.id = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars._ID)
    this.title = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)
    this.isPrimary = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.IS_PRIMARY) == 1
    this.name = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars.NAME)
    this.color = String.format("#%06X", 0xFFFFFF and CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_COLOR))
    this.ownerAccount = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars.OWNER_ACCOUNT)
    this.timeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Calendars.CALENDAR_TIME_ZONE)
    this.isVisible = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.VISIBLE) != 0
    this.isSynced = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.SYNC_EVENTS) != 0
    this.allowsModifications = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL) == CalendarContract.Calendars.CAL_ACCESS_ROOT ||
      CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL) == CalendarContract.Calendars.CAL_ACCESS_OWNER ||
      CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL) == CalendarContract.Calendars.CAL_ACCESS_EDITOR ||
      CalendarUtils.optIntFromCursor(cursor, CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL) == CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
    this.cursor = cursor
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
