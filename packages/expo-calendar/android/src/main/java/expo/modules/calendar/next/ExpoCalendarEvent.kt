package expo.modules.calendar.next

import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.sharedobjects.SharedObject

@OptIn(EitherType::class)
class ExpoCalendarEvent : SharedObject {
  val id: String?
  var calendarId: String? = null
  var title: String? = null
  var notes: String? = null
  var startDate: String? = null
  var endDate: String? = null
  var allDay: Boolean = false
  var location: String? = null
  var availability: String? = null
  var organizerEmail: String? = null
  var timeZone: String? = null
  var endTimeZone: String? = null
  var guestsCanModify: Boolean = false
  var guestsCanInviteOthers: Boolean = false
  var guestsCanSeeGuests: Boolean = false
  var originalId: String? = null

  constructor(id: String) {
    this.id = id
  }

  constructor(cursor: Cursor) {
    this.id = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events._ID)
    this.calendarId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.CALENDAR_ID)
    this.title = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.TITLE)
    this.notes = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.DESCRIPTION)
    this.startDate = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.DTSTART)
    this.endDate = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.DTEND)
    this.allDay = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.ALL_DAY) != 0
    this.location = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_LOCATION)
    this.availability = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.AVAILABILITY)
    this.organizerEmail = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.ORGANIZER)
    this.timeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_TIMEZONE)
    this.endTimeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_END_TIMEZONE)
    this.guestsCanModify = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_MODIFY) != 0
    this.guestsCanInviteOthers = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0
    this.guestsCanSeeGuests = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0
    this.originalId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.ORIGINAL_ID)
  }
}
