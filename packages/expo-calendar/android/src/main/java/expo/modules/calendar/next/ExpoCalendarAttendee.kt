package expo.modules.calendar.next

import android.content.ContentResolver
import android.content.ContentUris
import android.content.ContentValues
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.EventNotSavedException
import expo.modules.calendar.attendeeRelationshipConstantMatchingString
import expo.modules.calendar.attendeeRelationshipStringMatchingConstant
import expo.modules.calendar.attendeeStatusConstantMatchingString
import expo.modules.calendar.attendeeStatusStringMatchingConstant
import expo.modules.calendar.attendeeTypeConstantMatchingString
import expo.modules.calendar.attendeeTypeStringMatchingConstant
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.AttendeeRole
import expo.modules.calendar.next.records.AttendeeStatus
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.EventRecord
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import java.text.ParseException

class ExpoCalendarAttendee : SharedObject {
  var attendeeRecord: AttendeeRecord?
  var localAppContext: AppContext
  private val contentResolver
    get() = (localAppContext.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

  constructor(appContext: AppContext) {
    this.localAppContext = appContext
    this.attendeeRecord = null;
  }

  constructor(appContext: AppContext, cursor: Cursor) {
    this.localAppContext = appContext

    this.attendeeRecord = AttendeeRecord(
      id = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Attendees._ID),
      name = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_NAME),
      role = AttendeeRole.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)),
      status = AttendeeStatus.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_STATUS)),
      type = AttendeeType.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_TYPE)),
      email = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_EMAIL),
    )
  }

  @Throws(EventNotSavedException::class, ParseException::class, SecurityException::class, InvalidArgumentException::class)
  fun saveAttendee(attendeeRecord: AttendeeRecord, eventId: Int? = null): String {
    val isNew = attendeeRecord.id == null
    val attendeeValues = buildAttendeeContentValues(attendeeRecord, eventId)
    if (isNew) {
      if (eventId == null) {
        throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      }
      val attendeeUri = contentResolver.insert(CalendarContract.Attendees.CONTENT_URI, attendeeValues)
        ?: throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      val attendeeId = attendeeUri.lastPathSegment
        ?: throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      return attendeeId
    } else {
      val attendeeID = attendeeRecord.id
      if (attendeeID == null) {
        throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      }
      val updateUri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
      contentResolver.update(updateUri, attendeeValues, null, null)
      return attendeeID;
    }
  }

  @Throws(SecurityException::class)
  fun deleteAttendee(): Boolean {
    val rows: Int
    val attendeeID = attendeeRecord?.id?.toIntOrNull()
    if (attendeeID == null) {
      throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_DELETED")
    }
    val uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
    rows = contentResolver.delete(uri, null, null)
    attendeeRecord = null
    return rows > 0
  }

  private fun buildAttendeeContentValues(attendeeRecord: AttendeeRecord, eventId: Int?): ContentValues {
    val values = ContentValues()
    if (eventId != null) {
      values.put(CalendarContract.Attendees.EVENT_ID, eventId)
    }
    attendeeRecord.email?.let { values.put(CalendarContract.Attendees.ATTENDEE_EMAIL, it) }
    attendeeRecord.role?.let { values.put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, attendeeRelationshipConstantMatchingString(it.value)) }
    attendeeRecord.type?.let { values.put(CalendarContract.Attendees.ATTENDEE_TYPE, attendeeTypeConstantMatchingString(it.value)) }
    attendeeRecord.status?.let { values.put(CalendarContract.Attendees.ATTENDEE_STATUS, attendeeStatusConstantMatchingString(it.value)) }
    attendeeRecord.name?.let { values.put(CalendarContract.Attendees.ATTENDEE_NAME, it) }
    return values
  }
}
