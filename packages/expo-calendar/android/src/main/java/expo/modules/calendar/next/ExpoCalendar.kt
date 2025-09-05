package expo.modules.calendar.next

import android.content.ContentUris
import android.content.ContentValues
import android.database.Cursor
import android.provider.CalendarContract
import android.text.TextUtils
import expo.modules.calendar.availabilityConstantMatchingString
import expo.modules.calendar.findCalendarByIdQueryFields
import expo.modules.calendar.findCalendarsQueryParameters
import expo.modules.calendar.next.exceptions.CalendarCouldNotBeUpdatedException
import expo.modules.calendar.next.exceptions.CalendarNotFoundException
import expo.modules.calendar.next.exceptions.CalendarNotSupportedException
import expo.modules.calendar.next.exceptions.EventNotFoundException
import expo.modules.calendar.next.exceptions.EventsCouldNotBeCreatedException
import expo.modules.calendar.next.extensions.toCalendarRecord
import expo.modules.calendar.next.extensions.toEventRecord
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.utils.findEvents
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.TimeZone

class ExpoCalendar(val context: AppContext, var calendarRecord: CalendarRecord? = CalendarRecord()) : SharedObject(context) {
  suspend fun getEvents(startDate: Any, endDate: Any): List<ExpoCalendarEvent> {
    try {
      if (calendarRecord?.id == null) {
        throw EventNotFoundException("Calendar id is null")
      }
      val contentResolver = (context.reactContext
        ?: throw Exceptions.ReactContextLost()).contentResolver
      val cursor = findEvents(contentResolver, startDate, endDate, listOf(calendarRecord?.id
        ?: ""))
      return cursor.use { serializeExpoCalendarEvents(cursor) }
    } catch (e: Exception) {
      throw EventNotFoundException("Events could not be found", e)
    }
  }

  suspend fun deleteCalendar(): Boolean {
    return withContext(Dispatchers.IO) {
      val rows: Int
      val calendarID = calendarRecord?.id?.toIntOrNull()
        ?: throw EventNotFoundException("Calendar id is null")
      val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toLong())
      val contentResolver = (context.reactContext
        ?: throw Exceptions.ReactContextLost()).contentResolver
      rows = contentResolver.delete(uri, null, null)
      calendarRecord = null
      rows > 0
    }
  }

  suspend fun createEvent(record: EventRecord): ExpoCalendarEvent? {
    try {
      val event = ExpoCalendarEvent(context, record)
      val calendarId = calendarRecord?.id
        ?: throw EventsCouldNotBeCreatedException("Calendar id is null")
      val newEventId = event.saveEvent(record, calendarId)
      event.reloadEvent(newEventId.toString())
      return event
    } catch (e: Exception) {
      throw EventsCouldNotBeCreatedException("Event could not be created", e)
    }
  }

  fun getUpdatedRecord(other: CalendarRecord, nullableFields: List<String>? = null): CalendarRecord {
    val nullableSet = nullableFields?.toSet() ?: emptySet()
    val current = calendarRecord ?: CalendarRecord()
    
    fun <T> getValue(fieldName: String, otherValue: T?, currentValue: T): T = 
      if (fieldName in nullableSet) currentValue else otherValue ?: currentValue
    
    fun <T> getNullableValue(fieldName: String, otherValue: T?, currentValue: T?): T? = 
      if (fieldName in nullableSet) null else otherValue ?: currentValue

    return CalendarRecord(
      id = getNullableValue("id", other.id, current.id),
      title = getNullableValue("title", other.title, current.title),
      name = getNullableValue("name", other.name, current.name),
      source = getNullableValue("source", other.source, current.source),
      color = getNullableValue("color", other.color, current.color),
      isVisible = getValue("isVisible", other.isVisible, current.isVisible),
      isSynced = getValue("isSynced", other.isSynced, current.isSynced),
      timeZone = getNullableValue("timeZone", other.timeZone, current.timeZone),
      isPrimary = getValue("isPrimary", other.isPrimary, current.isPrimary),
      allowsModifications = getValue("allowsModifications", other.allowsModifications, current.allowsModifications),
      allowedAvailabilities = getValue("allowedAvailabilities", other.allowedAvailabilities, current.allowedAvailabilities),
      allowedReminders = getValue("allowedReminders", other.allowedReminders, current.allowedReminders),
      allowedAttendeeTypes = getValue("allowedAttendeeTypes", other.allowedAttendeeTypes, current.allowedAttendeeTypes),
      ownerAccount = getNullableValue("ownerAccount", other.ownerAccount, current.ownerAccount),
      accessLevel = getNullableValue("accessLevel", other.accessLevel, current.accessLevel)
    )
  }

  private fun serializeExpoCalendarEvents(cursor: Cursor): List<ExpoCalendarEvent> {
    val results: MutableList<ExpoCalendarEvent> = ArrayList()
    val contentResolver = (context.reactContext
      ?: throw Exceptions.ReactContextLost()).contentResolver
    while (cursor.moveToNext()) {
      results.add(ExpoCalendarEvent(context, eventRecord = cursor.toEventRecord(contentResolver)))
    }
    return results
  }

  companion object {
    suspend fun updateCalendar(appContext: AppContext, calendarRecord: CalendarRecord, isNew: Boolean = false): Int {
      return withContext(Dispatchers.IO) {
        if (isNew) {
          if (calendarRecord.title == null) {
            throw CalendarCouldNotBeUpdatedException("new calendars require `title`")
          }
          if (calendarRecord.name == null) {
            throw CalendarCouldNotBeUpdatedException("new calendars require `name`")
          }
          if (calendarRecord.source == null) {
            throw CalendarCouldNotBeUpdatedException("new calendars require `source`")
          }
          if (calendarRecord.color == null) {
            throw CalendarCouldNotBeUpdatedException("new calendars require `color`")
          }
        }

        val source = calendarRecord.source
        if (isNew && (source?.name == null)) {
          throw CalendarCouldNotBeUpdatedException("new calendars require a `source` object with a `name`")
        }

        val values = ContentValues().apply {
          calendarRecord.name?.let { put(CalendarContract.Calendars.NAME, it) }
          calendarRecord.title?.let { put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, it) }
          put(CalendarContract.Calendars.VISIBLE, calendarRecord.isVisible)
          put(CalendarContract.Calendars.SYNC_EVENTS, calendarRecord.isSynced)

          if (isNew) {
            source?.name?.let { put(CalendarContract.Calendars.ACCOUNT_NAME, it) }
            source?.let { put(CalendarContract.Calendars.ACCOUNT_TYPE, if (it.isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else it.type) }
          }

          calendarRecord.color?.let { put(CalendarContract.Calendars.CALENDAR_COLOR, it) }

          if (isNew) {
            calendarRecord.accessLevel?.let { accessLevel ->
              val accessLevelValue = when (accessLevel) {
                CalendarAccessLevel.OWNER -> CalendarContract.Calendars.CAL_ACCESS_OWNER
                CalendarAccessLevel.EDITOR -> CalendarContract.Calendars.CAL_ACCESS_EDITOR
                CalendarAccessLevel.CONTRIBUTOR -> CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
                CalendarAccessLevel.READ -> CalendarContract.Calendars.CAL_ACCESS_READ
                CalendarAccessLevel.RESPOND -> CalendarContract.Calendars.CAL_ACCESS_RESPOND
                CalendarAccessLevel.FREEBUSY -> CalendarContract.Calendars.CAL_ACCESS_FREEBUSY
                CalendarAccessLevel.OVERRIDE -> CalendarContract.Calendars.CAL_ACCESS_OVERRIDE
                CalendarAccessLevel.ROOT -> CalendarContract.Calendars.CAL_ACCESS_ROOT
                CalendarAccessLevel.NONE -> CalendarContract.Calendars.CAL_ACCESS_NONE
              }
              put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, accessLevelValue)
            }
          }
          if (isNew) {
            calendarRecord.ownerAccount?.let { put(CalendarContract.Calendars.OWNER_ACCOUNT, it) }
          }

          if (isNew) {
            calendarRecord.timeZone?.let { put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, it) }
              ?: put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, TimeZone.getDefault().id)
          }

          if (calendarRecord.allowedAvailabilities.isNotEmpty()) {
            val availabilityValues = calendarRecord.allowedAvailabilities.map { availability ->
              availabilityConstantMatchingString(availability)
            }
            if (availabilityValues.isNotEmpty()) {
              put(CalendarContract.Calendars.ALLOWED_AVAILABILITY, TextUtils.join(",", availabilityValues))
            }
          }

          if (calendarRecord.allowedReminders.isNotEmpty()) {
            put(CalendarContract.Calendars.ALLOWED_REMINDERS, TextUtils.join(",", calendarRecord.allowedReminders.map { it.value }))
          }

          if (calendarRecord.allowedAttendeeTypes.isNotEmpty()) {
            put(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES, TextUtils.join(",", calendarRecord.allowedAttendeeTypes.map { it.value }))
          }
        }

        val contentResolver = (appContext.reactContext
          ?: throw Exceptions.ReactContextLost()).contentResolver

        if (isNew) {
          val uriBuilder = CalendarContract.Calendars.CONTENT_URI
            .buildUpon()
            .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
            .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, source!!.name)
            .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, if (source.isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else source.type)

          val calendarsUri = uriBuilder.build()
          val calendarUri = contentResolver.insert(calendarsUri, values)
          val calendarId = calendarUri?.lastPathSegment!!.toInt()
          calendarId
        } else {
          val uri = CalendarContract.Calendars.CONTENT_URI.buildUpon().appendPath(calendarRecord.id).build()
          val rowsUpdated = contentResolver.update(uri, values, null, null)
          if (rowsUpdated == 0) {
            throw CalendarCouldNotBeUpdatedException("Failed to update calendar")
          }
          calendarRecord.id!!.toInt()
        }
      }
    }

    suspend fun findExpoCalendars(context: AppContext, type: String?): List<ExpoCalendar> {
      return withContext(Dispatchers.IO) {
        try {
          if (type != null && type == "reminder") {
            throw CalendarNotSupportedException("Calendars of type `reminder` are not supported on Android")
          }
          val contentResolver = (context.reactContext
            ?: throw Exceptions.ReactContextLost()).contentResolver
          val uri = CalendarContract.Calendars.CONTENT_URI
          val cursor = contentResolver.query(uri, findCalendarsQueryParameters, null, null, null)
          requireNotNull(cursor) { "Cursor shouldn't be null" }
          cursor.use { serializeExpoCalendars(context, it) }
        } catch (e: Exception) {
          throw CalendarNotFoundException( "Calendars could not be found", e)
        }
      }
    }

    suspend fun findExpoCalendarById(context: AppContext, calendarID: String): ExpoCalendar? {
      return withContext(Dispatchers.IO) {
        val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toInt().toLong())
        val contentResolver = (context.reactContext
          ?: throw Exceptions.ReactContextLost()).contentResolver
        val cursor = contentResolver.query(
          uri,
          findCalendarByIdQueryFields,
          null,
          null,
          null
        )
        requireNotNull(cursor) { "Cursor shouldn't be null" }
        cursor.use {
          if (it.count > 0) {
            it.moveToFirst()
            ExpoCalendar(context, calendarRecord = cursor.toCalendarRecord())
          } else {
            null
          }
        } ?: throw CalendarNotFoundException("Calendar with id $calendarID not found")
      }
    }

    suspend fun listEvents(context: AppContext, calendarIds: List<String>, startDate: String, endDate: String): List<ExpoCalendarEvent> {
      try {
        val contentResolver = (context.reactContext
          ?: throw Exceptions.ReactContextLost()).contentResolver
        val allEvents = mutableListOf<ExpoCalendarEvent>()
        val cursor = findEvents(contentResolver, startDate, endDate, calendarIds)
        cursor.use {
          while (it.moveToNext()) {
            val event = ExpoCalendarEvent(context, eventRecord = cursor.toEventRecord(contentResolver))
            allEvents.add(event)
          }
        }
        return allEvents
      } catch (e: Exception) {
        throw EventNotFoundException("Events could not be found", e)
      }
    }

    private fun serializeExpoCalendars(context: AppContext, cursor: Cursor): List<ExpoCalendar> {
      val results: MutableList<ExpoCalendar> = ArrayList()
      while (cursor.moveToNext()) {
        results.add(ExpoCalendar(context, calendarRecord = cursor.toCalendarRecord()))
      }
      return results
    }
  }
}
