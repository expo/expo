package expo.modules.calendar.next

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.domain.calendar.CalendarRepository
import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.calendar.next.domain.CalendarEntity
import expo.modules.calendar.next.exceptions.CalendarCouldNotBeUpdatedException
import expo.modules.calendar.next.exceptions.CalendarNotFoundException
import expo.modules.calendar.next.exceptions.CalendarNotSupportedException
import expo.modules.calendar.next.exceptions.EventNotFoundException
import expo.modules.calendar.next.exceptions.EventsCouldNotBeCreatedException
import expo.modules.calendar.next.extensions.toCalendarEntity
import expo.modules.calendar.next.extensions.toEventRecord
import expo.modules.calendar.next.mappers.CalendarMapper
import expo.modules.calendar.next.records.AlarmMethod as AlarmMethodRecord
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.Source
import expo.modules.calendar.next.utils.findEvents
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.TimeZone
import androidx.core.graphics.toColorInt

class ExpoCalendar(
  context: AppContext,
  mapper: CalendarMapper,
  entity: CalendarEntity
) : SharedObject(context) {
  var id: String? private set
  var title: String? private set
  var name: String? private set
  var source: Source? private set
  var color: String? private set
  var isVisible: Boolean private set
  var isSynced: Boolean private set
  var timeZone: String? private set
  var isPrimary: Boolean private set
  var allowsModifications: Boolean private set
  var allowedAvailabilities: List<String> private set
  var allowedReminders: List<AlarmMethodRecord> private set
  var allowedAttendeeTypes: List<AttendeeType> private set
  var ownerAccount: String? private set
  var accessLevel: CalendarAccessLevel? private set

  init {
    mapper.toExpoCalendarData(entity)
      .also { data ->
        id = data.id
        title = data.title
        name = data.name
        source = data.source
        color = data.color
        isVisible = data.isVisible
        isSynced = data.isSynced
        timeZone = data.timeZone
        isPrimary = data.isPrimary
        allowsModifications = data.allowsModifications
        ownerAccount = data.ownerAccount
        accessLevel = data.accessLevel
        allowedAvailabilities = data.allowedAvailabilities
        allowedReminders = data.allowedReminders
        allowedAttendeeTypes = data.allowedAttendeeTypes
      }
  }

  val reactContext: Context
    get() = appContext?.reactContext ?: throw Exceptions.ReactContextLost()

  suspend fun getEvents(startDate: String, endDate: String): List<ExpoCalendarEvent> {
    try {
      if (id == null) {
        throw EventNotFoundException("Calendar id is null")
      }
      val contentResolver = reactContext.contentResolver

      return findEvents(
        contentResolver,
        startDate,
        endDate,
        listOf(id ?: "")
      ).use { serializeExpoCalendarEvents(it) }
    } catch (e: Exception) {
      throw EventNotFoundException("Events could not be found", e)
    }
  }

  suspend fun deleteCalendar(): Boolean {
    return withContext(Dispatchers.IO) {
      val calendarID = id?.toLongOrNull()
        ?: throw EventNotFoundException("Calendar id is null")
      val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID)
      val contentResolver = reactContext.contentResolver
      val rows = contentResolver.delete(uri, null, null)
      update(CalendarRecord())
      rows > 0
    }
  }

  suspend fun createEvent(record: EventRecord): ExpoCalendarEvent? {
    try {
      val event = ExpoCalendarEvent(
        appContext
          ?: throw Exceptions.AppContextLost(),
        record
      )
      val calendarId = id
        ?: throw EventsCouldNotBeCreatedException("Calendar id is null")
      val newEventId = event.saveEvent(record, calendarId)
      event.reloadEvent(newEventId.toString())
      return event
    } catch (e: Exception) {
      throw EventsCouldNotBeCreatedException("Event could not be created", e)
    }
  }

  fun update(record: CalendarRecord) {
    id = record.id
    title = record.title
    name = record.name
    source = record.source
    color = record.color?.let { String.format("#%06X", 0xFFFFFF and it) }
    isVisible = record.isVisible
    isSynced = record.isSynced
    timeZone = record.timeZone
    isPrimary = record.isPrimary
    allowsModifications = record.allowsModifications
    allowedAvailabilities = record.allowedAvailabilities
    allowedReminders = record.allowedReminders
    allowedAttendeeTypes = record.allowedAttendeeTypes
    ownerAccount = record.ownerAccount
    accessLevel = record.accessLevel
  }

  fun getUpdatedRecord(other: CalendarRecord, nullableFields: List<String>? = null): CalendarRecord {
    val nullableSet = nullableFields?.toSet() ?: emptySet()

    fun <T> getValue(fieldName: String, otherValue: T?, currentValue: T): T =
      if (fieldName in nullableSet) currentValue else otherValue ?: currentValue

    fun <T> getNullableValue(fieldName: String, otherValue: T?, currentValue: T?): T? =
      if (fieldName in nullableSet) null else otherValue ?: currentValue

    return CalendarRecord(
      id = getNullableValue("id", other.id, id),
      title = getNullableValue("title", other.title, title),
      name = getNullableValue("name", other.name, name),
      source = getNullableValue("source", other.source, source),
      // TODO: Remove temporary color parsing
      color = getNullableValue("color", other.color, color?.toColorInt()),
      isVisible = getValue("isVisible", other.isVisible, isVisible),
      isSynced = getValue("isSynced", other.isSynced, isSynced),
      timeZone = getNullableValue("timeZone", other.timeZone, timeZone),
      isPrimary = getValue("isPrimary", other.isPrimary, isPrimary),
      allowsModifications = getValue("allowsModifications", other.allowsModifications, allowsModifications),
      allowedAvailabilities = getValue("allowedAvailabilities", other.allowedAvailabilities, allowedAvailabilities),
      allowedReminders = getValue("allowedReminders", other.allowedReminders, allowedReminders),
      allowedAttendeeTypes = getValue("allowedAttendeeTypes", other.allowedAttendeeTypes, allowedAttendeeTypes),
      ownerAccount = getNullableValue("ownerAccount", other.ownerAccount, ownerAccount),
      accessLevel = getNullableValue("accessLevel", other.accessLevel, accessLevel)
    )
  }

  private fun serializeExpoCalendarEvents(cursor: Cursor): List<ExpoCalendarEvent> {
    val results = mutableListOf<ExpoCalendarEvent>()
    val contentResolver = reactContext.contentResolver
    while (cursor.moveToNext()) {
      results.add(
        ExpoCalendarEvent(
          appContext ?: throw Exceptions.AppContextLost(),
          eventRecord = cursor.toEventRecord(contentResolver)
        )
      )
    }
    return results
  }

  companion object {
    suspend fun updateCalendar(appContext: AppContext, calendarRecord: CalendarRecord, isNew: Boolean = false): Long {
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
        if (isNew && source?.name == null) {
          throw CalendarCouldNotBeUpdatedException("new calendars require a `source` object with a `name`")
        }

        val values = ContentValues().apply {
          put(CalendarContract.Calendars.NAME, calendarRecord.name)
          put(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME, calendarRecord.title)
          put(CalendarContract.Calendars.VISIBLE, calendarRecord.isVisible)
          put(CalendarContract.Calendars.SYNC_EVENTS, calendarRecord.isSynced)
          put(CalendarContract.Calendars.CALENDAR_COLOR, calendarRecord.color)

          if (isNew) {
            put(CalendarContract.Calendars.ACCOUNT_NAME, source?.name)
            put(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL, calendarRecord.accessLevel?.toAndroidValue())
            put(CalendarContract.Calendars.OWNER_ACCOUNT, calendarRecord.ownerAccount)
            put(CalendarContract.Calendars.CALENDAR_TIME_ZONE, calendarRecord.timeZone ?: TimeZone.getDefault().id)
            put(
              CalendarContract.Calendars.ACCOUNT_TYPE,
              if (source != null && source.isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else source?.type
            )
          }

          if (calendarRecord.allowedAvailabilities.isNotEmpty()) {
            val availabilityValues = calendarRecord.allowedAvailabilities.map { availability ->
              Availability.fromString(availability).contentProviderValue
            }
            if (availabilityValues.isNotEmpty()) {
              put(
                CalendarContract.Calendars.ALLOWED_AVAILABILITY,
                availabilityValues.joinToString(separator = ",")
              )
            }
          }

          if (calendarRecord.allowedReminders.isNotEmpty()) {
            put(
              CalendarContract.Calendars.ALLOWED_REMINDERS,
              calendarRecord.allowedReminders.joinToString(separator = ",")
            )
          }

          if (calendarRecord.allowedAttendeeTypes.isNotEmpty()) {
            put(
              CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES,
              calendarRecord.allowedAttendeeTypes.joinToString(separator = ",")
            )
          }
        }

        val contentResolver = (
          appContext.reactContext
            ?: throw Exceptions.ReactContextLost()
          ).contentResolver

        if (isNew) {
          val uriBuilder = CalendarContract.Calendars.CONTENT_URI
            .buildUpon()
            .appendQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER, "true")
            .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME, source!!.name)
            .appendQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE, if (source.isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else source.type)

          val calendarsUri = uriBuilder.build()
          val calendarUri = contentResolver.insert(calendarsUri, values)
          val calendarId = calendarUri?.lastPathSegment!!.toLong()
          calendarId
        } else {
          val uri = CalendarContract.Calendars.CONTENT_URI.buildUpon().appendPath(calendarRecord.id).build()
          val rowsUpdated = contentResolver.update(uri, values, null, null)
          if (rowsUpdated == 0) {
            throw CalendarCouldNotBeUpdatedException("Failed to update calendar")
          }
          calendarRecord.id!!.toLong()
        }
      }
    }

    suspend fun findExpoCalendars(context: AppContext, mapper: CalendarMapper, type: String?): List<ExpoCalendar> {
      return withContext(Dispatchers.IO) {
        try {
          if (type != null && type == "reminder") {
            throw CalendarNotSupportedException("Calendars of type `reminder` are not supported on Android")
          }
          val contentResolver = (
            context.reactContext
              ?: throw Exceptions.ReactContextLost()
            ).contentResolver
          val uri = CalendarContract.Calendars.CONTENT_URI
          val projection = CalendarRepository.findCalendarsQueryParameters
          val cursor = contentResolver.query(uri, projection, null, null, null)
          requireNotNull(cursor) { "Cursor shouldn't be null" }
          cursor.use { serializeExpoCalendars(context, mapper, it) }
        } catch (e: Exception) {
          throw CalendarNotFoundException("Calendars could not be found", e)
        }
      }
    }

    suspend fun findExpoCalendarById(context: AppContext, mapper: CalendarMapper, calendarID: String): ExpoCalendar? {
      return withContext(Dispatchers.IO) {
        val uri = ContentUris.withAppendedId(CalendarContract.Calendars.CONTENT_URI, calendarID.toLong())
        val contentResolver = (
          context.reactContext
            ?: throw Exceptions.ReactContextLost()
          ).contentResolver
        val projection = CalendarRepository.findCalendarByIdQueryFields
        val cursor = contentResolver.query(
          uri,
          projection,
          null,
          null,
          null
        )
        requireNotNull(cursor) { "Cursor shouldn't be null" }
        cursor.use {
          if (it.count > 0) {
            it.moveToFirst()
            ExpoCalendar(context, mapper, entity = cursor.toCalendarEntity())
          } else {
            null
          }
        } ?: throw CalendarNotFoundException("Calendar with id $calendarID not found")
      }
    }

    suspend fun listEvents(context: AppContext, calendarIds: List<String>, startDate: String, endDate: String): List<ExpoCalendarEvent> {
      try {
        val contentResolver = (
          context.reactContext
            ?: throw Exceptions.ReactContextLost()
          ).contentResolver
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

    private fun serializeExpoCalendars(context: AppContext, mapper: CalendarMapper, cursor: Cursor): List<ExpoCalendar> {
      val results = mutableListOf<ExpoCalendar>()
      while (cursor.moveToNext()) {
        results.add(ExpoCalendar(context, mapper, entity = cursor.toCalendarEntity()))
      }
      return results
    }
  }
}
