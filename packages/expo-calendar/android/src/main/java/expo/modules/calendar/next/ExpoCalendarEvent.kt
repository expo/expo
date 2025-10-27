package expo.modules.calendar.next

import android.content.ContentUris
import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.domain.attendee.AttendeeRepository
import expo.modules.calendar.domain.event.EventRepository
import expo.modules.calendar.next.exceptions.AttendeeNotFoundException
import expo.modules.calendar.next.exceptions.EventCouldNotBeDeletedException
import expo.modules.calendar.next.exceptions.EventNotFoundException
import expo.modules.calendar.next.exceptions.EventsCouldNotBeCreatedException
import expo.modules.calendar.next.extensions.toAttendeeRecord
import expo.modules.calendar.next.extensions.toEventRecord
import expo.modules.calendar.next.records.AlarmRecord
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.calendar.next.utils.createRecurrenceRule
import expo.modules.calendar.next.utils.dateToMilliseconds
import expo.modules.calendar.next.utils.removeRemindersForEvent
import expo.modules.calendar.next.utils.sdf
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Calendar
import java.util.TimeZone

class ExpoCalendarEvent(
  context: AppContext,
  var eventRecord: EventRecord? = EventRecord(),
  var options: RecurringEventOptions? = RecurringEventOptions()
) : SharedObject(context) {

  val reactContext: Context
    get() = appContext?.reactContext ?: throw Exceptions.ReactContextLost()

  suspend fun saveEvent(eventRecord: EventRecord, calendarId: String? = null, nullableFields: List<String>? = null): Int? {
    return withContext(Dispatchers.IO) {
      val eventBuilder = CalendarBuilderNext()

      eventBuilder
        .put(CalendarContract.Events.TITLE, eventRecord.title)
        .put(CalendarContract.Events.ALL_DAY, eventRecord.allDay)
        .put(CalendarContract.Events.DESCRIPTION, eventRecord.notes)
        .put(CalendarContract.Events.EVENT_LOCATION, eventRecord.location)
        .put(CalendarContract.Events.GUESTS_CAN_MODIFY, eventRecord.guestsCanModify)
        .put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, eventRecord.guestsCanInviteOthers)
        .put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, eventRecord.guestsCanSeeGuests)
        .put(CalendarContract.Events.DTSTART, dateToMilliseconds(eventRecord.startDate))
        .put(CalendarContract.Events.DTEND, dateToMilliseconds(eventRecord.endDate))
        .put(CalendarContract.Events.AVAILABILITY, eventRecord.availability?.toAndroidValue(eventRecord.availability))
        .put(CalendarContract.Events.STATUS, eventRecord.status?.toAndroidValue(eventRecord.status))
        .put(CalendarContract.Events.ORGANIZER, eventRecord.organizerEmail)
        .put(CalendarContract.Events.ACCESS_LEVEL, eventRecord.accessLevel?.toAndroidValue(eventRecord.accessLevel))

      if (eventRecord.recurrenceRule != null) {
        val recurrenceRule = eventRecord.recurrenceRule.toRrFormat()
        if (recurrenceRule?.frequency != null) {
          if (recurrenceRule.endDate == null && recurrenceRule.occurrence == null) {
            val eventStartDate = eventBuilder.getAsLong(CalendarContract.Events.DTSTART)
            val eventEndDate = eventBuilder.getAsLong(CalendarContract.Events.DTEND)
            val duration = (eventEndDate - eventStartDate) / 1000
            eventBuilder
              .putNull(CalendarContract.Events.LAST_DATE)
              .putNull(CalendarContract.Events.DTEND)
              .put(CalendarContract.Events.DURATION, "PT${duration}S")
          }
          val rule = createRecurrenceRule(recurrenceRule)
          eventBuilder.put(CalendarContract.Events.RRULE, rule)
        }
      } else {
        eventBuilder
          .putNull(CalendarContract.Events.RRULE)
          .putNull(CalendarContract.Events.DURATION)
      }

      eventBuilder.put(CalendarContract.Events.EVENT_TIMEZONE, eventRecord.timeZone ?: TimeZone.getDefault().id)

      if (eventRecord.endTimeZone != null) {
        eventBuilder.put(CalendarContract.Events.EVENT_END_TIMEZONE, eventRecord.endTimeZone)
      } else {
        eventBuilder.put(CalendarContract.Events.EVENT_END_TIMEZONE, TimeZone.getDefault().id)
      }

      // Remove all nullable fields from the event builder that are possible to remove
      cleanNullableFields(eventBuilder, nullableFields)

      if (this@ExpoCalendarEvent.eventRecord?.id != null) {
        // Update current event
        val eventID = this@ExpoCalendarEvent.eventRecord?.id?.toIntOrNull()
          ?: throw EventNotFoundException("Event ID is required")

        val updateUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
        val contentResolver = reactContext.contentResolver

        contentResolver.update(updateUri, eventBuilder.build(), null, null)
        removeRemindersForEvent(contentResolver, eventID)

        if (eventRecord.alarms != null) {
          createRemindersForEvent(eventID, eventRecord.alarms)
        }

        eventID
      } else {
        // Create a new event
        if (calendarId == null) {
          throw InvalidArgumentException("CalendarId is required.")
        }
        eventBuilder.put(CalendarContract.Events.CALENDAR_ID, calendarId.toInt())
        val eventsUri = CalendarContract.Events.CONTENT_URI
        val contentResolver = reactContext.contentResolver
        val eventUri = contentResolver.insert(eventsUri, eventBuilder.build())
          ?: throw EventsCouldNotBeCreatedException("Failed to insert event into the database")
        val eventID = eventUri.lastPathSegment!!.toInt()
        if (eventRecord.alarms != null) {
          createRemindersForEvent(eventID, eventRecord.alarms)
        }
        eventID
      }
    }
  }

  suspend fun createAttendee(attendeeRecord: AttendeeRecord): ExpoCalendarAttendee? {
    val attendee = ExpoCalendarAttendee(appContext ?: throw Exceptions.AppContextLost())
    val eventId = eventRecord?.id?.toIntOrNull()
      ?: throw EventNotFoundException("Event ID is required")

    val newAttendeeId = attendee.saveAttendee(attendeeRecord, eventId)
    attendee.reloadAttendee(newAttendeeId)
    return attendee
  }

  suspend fun deleteEvent() {
    withContext(Dispatchers.IO) {
      val eventID = eventRecord?.id?.toInt()
        ?: throw EventCouldNotBeDeletedException("Event ID is required")

      val contentResolver = reactContext.contentResolver

      if (options?.futureEvents == null || options?.futureEvents == false) {
        val url = ContentUris.withAppendedId(
          CalendarContract.Events.CONTENT_URI,
          eventID.toLong()
        )
        contentResolver
          .delete(url, null, null)
          .takeIf { it > 0 }
          ?.let {
            eventRecord = null
          } ?: throw EventCouldNotBeDeletedException("Event could not be deleted")
      } else {
        // Get the exact occurrence and create an exception for it
        val exceptionValues = ContentValues()
        val startCal = Calendar.getInstance()
        val instanceStartDate = options?.instanceStartDate

        val dateString = instanceStartDate ?: eventRecord?.startDate
          ?: throw EventCouldNotBeDeletedException("Event start date is required")

        val parsedDate = sdf.parse(dateString)
          ?: throw EventCouldNotBeDeletedException("Event start date could not be parsed")

        startCal.time = parsedDate
        exceptionValues.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, startCal.timeInMillis)
        exceptionValues.put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED)

        val exceptionUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_EXCEPTION_URI, eventID.toLong())
        contentResolver.insert(exceptionUri, exceptionValues)
      }
    }
  }

  suspend fun reloadEvent(eventId: String? = null) {
    withContext(Dispatchers.IO) {
      val eventID = (eventId ?: eventRecord?.id)?.toIntOrNull()
        ?: throw EventNotFoundException("Event ID is required")

      val contentResolver = reactContext.contentResolver
      val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      val projection = EventRepository.findEventByIdQueryParameters
      val cursor = contentResolver.query(uri, projection, null, null, null)

      requireNotNull(cursor) { "Cursor shouldn't be null" }
      cursor.use {
        if (it.count > 0) {
          it.moveToFirst()
          eventRecord = it.toEventRecord(contentResolver)
        }
      }
    }
  }

  suspend fun getAttendees(): List<ExpoCalendarAttendee> {
    return withContext(Dispatchers.IO) {
      try {
        val eventID = eventRecord?.id?.toLong()
          ?: throw EventNotFoundException("Event ID is required")

        val contentResolver = reactContext.contentResolver
        val projection = AttendeeRepository.findAttendeesByEventIdQueryParameters
        val cursor = CalendarContract.Attendees.query(
          contentResolver,
          eventID,
          projection
        )

        cursor.use { serializeExpoCalendarAttendees(it) }
      } catch (e: Exception) {
        throw AttendeeNotFoundException("Attendees could not be found", e)
      }
    }
  }

  fun getOccurrence(options: RecurringEventOptions?): ExpoCalendarEvent {
    if (options?.instanceStartDate == null) {
      return this
    }
    return ExpoCalendarEvent(
      appContext ?: throw Exceptions.AppContextLost(),
      eventRecord ?: EventRecord(),
      options
    )
  }

  private fun cleanNullableFields(eventBuilder: CalendarBuilderNext, nullableFields: List<String>?) {
    val nullableSet = nullableFields?.toSet() ?: emptySet()

    val fieldMappings = mapOf(
      "location" to CalendarContract.Events.EVENT_LOCATION,
      "timeZone" to CalendarContract.Events.EVENT_TIMEZONE,
      "endTimeZone" to CalendarContract.Events.EVENT_END_TIMEZONE,
      "notes" to CalendarContract.Events.DESCRIPTION,
      "recurrenceRule" to CalendarContract.Events.RRULE,
      "accessLevel" to CalendarContract.Events.ACCESS_LEVEL,
      "guestsCanModify" to CalendarContract.Events.GUESTS_CAN_MODIFY,
      "guestsCanInviteOthers" to CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS,
      "guestsCanSeeGuests" to CalendarContract.Events.GUESTS_CAN_SEE_GUESTS,
      "organizerEmail" to CalendarContract.Events.ORGANIZER,
      "status" to CalendarContract.Events.STATUS,
      "availability" to CalendarContract.Events.AVAILABILITY,
      "allDay" to CalendarContract.Events.ALL_DAY,
      "startDate" to CalendarContract.Events.DTSTART,
      "endDate" to CalendarContract.Events.DTEND
    )

    fieldMappings.forEach { (fieldName, columnName) ->
      if (fieldName in nullableSet) {
        eventBuilder.putNull(columnName)
      }
    }
  }

  private fun createRemindersForEvent(eventID: Int, reminders: List<AlarmRecord>) {
    val contentResolver = reactContext.contentResolver
    reminders
      .filter { it.relativeOffset != null }
      .map { reminder ->
        val minutes = -reminder.relativeOffset!!
        val method = reminder.method?.toAndroidValue() ?: CalendarContract.Reminders.METHOD_DEFAULT
        ContentValues().apply {
          put(CalendarContract.Reminders.EVENT_ID, eventID)
          put(CalendarContract.Reminders.MINUTES, minutes)
          put(CalendarContract.Reminders.METHOD, method)
        }
      }
      .forEach { reminderValues ->
        contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues)
      }
  }

  private fun serializeExpoCalendarAttendees(cursor: Cursor): List<ExpoCalendarAttendee> {
    val results = mutableListOf<ExpoCalendarAttendee>()

    while (cursor.moveToNext()) {
      results.add(
        ExpoCalendarAttendee(
          appContext ?: throw Exceptions.AppContextLost(),
          attendeeRecord = cursor.toAttendeeRecord()
        )
      )
    }
    return results
  }

  companion object {
    suspend fun findEventById(eventID: String, appContext: AppContext): ExpoCalendarEvent? {
      return withContext(Dispatchers.IO) {
        val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toInt().toLong())
        val selection = "((${CalendarContract.Events.DELETED} != 1))"
        val projection = EventRepository.findEventByIdQueryParameters
        val contentResolver = appContext.reactContext?.contentResolver
          ?: throw Exceptions.ReactContextLost()

        val cursor = contentResolver.query(
          uri,
          projection,
          selection,
          null,
          null
        )
        requireNotNull(cursor) { "Cursor shouldn't be null" }
        cursor.use {
          if (cursor.count > 0) {
            cursor.moveToFirst()
            ExpoCalendarEvent(appContext, eventRecord = cursor.toEventRecord(contentResolver))
          } else {
            null
          }
        } ?: throw EventNotFoundException("Event with id $eventID not found")
      }
    }
  }
}
