package expo.modules.calendar.next

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.sharedobjects.SharedObject

@OptIn(EitherType::class)
class ExpoCalendarEvent : SharedObject {
  val id: String?
  val title: String?

  constructor(id: String) {
    this.id = id
    this.title = null
  }

  constructor(cursor: Cursor) {
    this.id = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events._ID)
    this.title = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.TITLE)
  }
}
