package expo.modules.calendar.next

import android.content.ContentUris
import android.content.ContentValues
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.EventNotSavedException
import expo.modules.calendar.attendeeRelationshipConstantMatchingString
import expo.modules.calendar.attendeeStatusConstantMatchingString
import expo.modules.calendar.attendeeTypeConstantMatchingString
import expo.modules.calendar.findAttendeesByEventIdQueryParameters
import expo.modules.calendar.next.records.AttendeeRecord
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
    this.attendeeRecord = AttendeeRecord.fromCursor(cursor, contentResolver)
  }

  @Throws(EventNotSavedException::class, ParseException::class, SecurityException::class, InvalidArgumentException::class)
  fun saveAttendee(attendeeRecord: AttendeeRecord, eventId: Int? = null, nullableFields: List<String>? = null): String {
    val attendeeValues = buildAttendeeContentValues(attendeeRecord, eventId)
    cleanNullableFields(attendeeValues, nullableFields)
    if (this.attendeeRecord?.id == null) {
      if (eventId == null) {
        throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      }
      val attendeeUri = contentResolver.insert(CalendarContract.Attendees.CONTENT_URI, attendeeValues)
        ?: throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      val attendeeId = attendeeUri.lastPathSegment
        ?: throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      return attendeeId
    } else {
      val attendeeID = this.attendeeRecord?.id
      if (attendeeID == null) {
        throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_CREATED")
      }
      val updateUri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
      contentResolver.update(updateUri, attendeeValues, null, null)
      return attendeeID;
    }
  }

  private fun cleanNullableFields(attendeeBuilder: ContentValues, nullableFields: List<String>?) {
    val nullableSet = nullableFields?.toSet() ?: emptySet()
    if ("email" in nullableSet) {
      attendeeBuilder.putNull(CalendarContract.Attendees.ATTENDEE_EMAIL)
    }
    if ("name" in nullableSet) {
      attendeeBuilder.putNull(CalendarContract.Attendees.ATTENDEE_NAME)
    }
    if ("role" in nullableSet) {
      attendeeBuilder.putNull(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)
    }
    if ("type" in nullableSet) {
      attendeeBuilder.putNull(CalendarContract.Attendees.ATTENDEE_TYPE)
    }
    if ("status" in nullableSet) {
      attendeeBuilder.putNull(CalendarContract.Attendees.ATTENDEE_STATUS)
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

  fun reloadAttendee(attendeeID: String? = null) {
    val attendeeID = (attendeeID ?: attendeeRecord?.id)?.toIntOrNull()
    if (attendeeID == null) {
      throw Exceptions.IllegalStateException("E_ATTENDEE_NOT_RELOADED")
    }
    val uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
    val cursor = contentResolver.query(uri, findAttendeesByEventIdQueryParameters, null, null, null)
    requireNotNull(cursor) { "Cursor shouldn't be null" }
    cursor.use {
      if (it.count > 0) {
        it.moveToFirst()
        attendeeRecord = AttendeeRecord.fromCursor(it, contentResolver)
      }
    }
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
