package expo.modules.calendar.next

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.provider.CalendarContract
import expo.modules.calendar.attendeeRelationshipConstantMatchingString
import expo.modules.calendar.attendeeStatusConstantMatchingString
import expo.modules.calendar.attendeeTypeConstantMatchingString
import expo.modules.calendar.findAttendeesByEventIdQueryParameters
import expo.modules.calendar.next.exceptions.AttendeeCouldNotBeCreatedException
import expo.modules.calendar.next.exceptions.AttendeeCouldNotBeDeletedException
import expo.modules.calendar.next.exceptions.AttendeeNotFoundException
import expo.modules.calendar.next.extensions.toAttendeeRecord
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpoCalendarAttendee(
  context: AppContext,
  var attendeeRecord: AttendeeRecord? = AttendeeRecord()
) : SharedObject(context) {

  val reactContext: Context
    get() = appContext?.reactContext ?: throw Exceptions.ReactContextLost()

  suspend fun saveAttendee(attendeeRecord: AttendeeRecord, eventId: Int? = null, nullableFields: List<String>? = null): String {
    return withContext(Dispatchers.IO) {
      val attendeeValues = buildAttendeeContentValues(attendeeRecord, eventId)
      val contentResolver = reactContext.contentResolver
      cleanNullableFields(attendeeValues, nullableFields)
      if (this@ExpoCalendarAttendee.attendeeRecord?.id == null) {
        if (eventId == null) {
          throw AttendeeCouldNotBeCreatedException( "Event ID must be provided when creating a new attendee")
        }
        val attendeeUri = contentResolver.insert(CalendarContract.Attendees.CONTENT_URI, attendeeValues)
          ?: throw AttendeeCouldNotBeCreatedException( "Failed to insert attendee into the database")
        val attendeeId = attendeeUri.lastPathSegment
          ?: throw AttendeeCouldNotBeCreatedException("Failed to retrieve attendee ID after insertion")
        attendeeId
      } else {
        val attendeeID = this@ExpoCalendarAttendee.attendeeRecord?.id
        if (attendeeID == null) {
          throw AttendeeCouldNotBeCreatedException("Attendee ID is missing for an existing attendee record during update.")
        }
        val updateUri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
        contentResolver.update(updateUri, attendeeValues, null, null)
        attendeeID
      }
    }
  }

  suspend fun deleteAttendee() {
    return withContext(Dispatchers.IO) {
      val attendeeID = attendeeRecord?.id?.toIntOrNull()
        ?: throw AttendeeCouldNotBeDeletedException("Attendee ID not found")

      val contentResolver = reactContext.contentResolver

      val uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
      val rows = contentResolver.delete(uri, null, null)
      attendeeRecord = null
      check(rows > 0) { throw AttendeeCouldNotBeDeletedException("An error occurred while deleting attendee") }
    }
  }

  suspend fun reloadAttendee(attendeeID: String? = null) {
    withContext(Dispatchers.IO) {
      val attendeeID = (attendeeID ?: attendeeRecord?.id)?.toIntOrNull()
        ?: throw AttendeeNotFoundException("Attendee ID not found")

      val contentResolver = reactContext.contentResolver
      val uri = ContentUris.withAppendedId(CalendarContract.Attendees.CONTENT_URI, attendeeID.toLong())
      val cursor = contentResolver.query(uri, findAttendeesByEventIdQueryParameters, null, null, null)
      requireNotNull(cursor) { "Cursor shouldn't be null" }
      cursor.use {
        if (it.count > 0) {
          it.moveToFirst()
          attendeeRecord = it.toAttendeeRecord()
        }
      }
    }
  }

  private fun cleanNullableFields(attendeeBuilder: ContentValues, nullableFields: List<String>?) {
    val nullableSet = nullableFields?.toSet() ?: emptySet()
    
    val fieldMappings = mapOf(
      "email" to CalendarContract.Attendees.ATTENDEE_EMAIL,
      "name" to CalendarContract.Attendees.ATTENDEE_NAME,
      "role" to CalendarContract.Attendees.ATTENDEE_RELATIONSHIP,
      "type" to CalendarContract.Attendees.ATTENDEE_TYPE,
      "status" to CalendarContract.Attendees.ATTENDEE_STATUS
    )
    
    fieldMappings.forEach { (fieldName, columnName) ->
      if (fieldName in nullableSet) {
        attendeeBuilder.putNull(columnName)
      }
    }
  }

  private fun buildAttendeeContentValues(attendeeRecord: AttendeeRecord, eventId: Int?): ContentValues {
    val values = ContentValues()

    eventId?.let { values.put(CalendarContract.Attendees.EVENT_ID, it) }
    attendeeRecord.email?.let { values.put(CalendarContract.Attendees.ATTENDEE_EMAIL, it) }
    attendeeRecord.role?.let { values.put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, attendeeRelationshipConstantMatchingString(it.value)) }
    attendeeRecord.type?.let { values.put(CalendarContract.Attendees.ATTENDEE_TYPE, attendeeTypeConstantMatchingString(it.value)) }
    attendeeRecord.status?.let { values.put(CalendarContract.Attendees.ATTENDEE_STATUS, attendeeStatusConstantMatchingString(it.value)) }
    attendeeRecord.name?.let { values.put(CalendarContract.Attendees.ATTENDEE_NAME, it) }

    return values
  }
}
