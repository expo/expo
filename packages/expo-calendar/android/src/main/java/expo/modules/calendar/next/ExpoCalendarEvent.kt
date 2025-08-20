package expo.modules.calendar.next

import android.content.ContentUris
import android.content.ContentValues
import android.database.Cursor
import android.provider.CalendarContract
import android.util.Log
import expo.modules.calendar.CalendarModule.Companion.TAG
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.CalendarUtils.removeRemindersForEvent
import expo.modules.calendar.EventNotSavedException
import expo.modules.calendar.EventRecurrenceUtils.createRecurrenceRule
import expo.modules.calendar.findAttendeesByEventIdQueryParameters
import expo.modules.calendar.findEventByIdQueryParameters
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.kotlin.exception.Exceptions
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.AlarmRecord
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventStatus
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import java.text.ParseException
import java.util.*


@OptIn(EitherType::class)
class ExpoCalendarEvent : SharedObject {
  var eventRecord: EventRecord?

  val sdf = CalendarUtils.sdf
  private val localAppContext: AppContext
  private val contentResolver
    get() = (localAppContext.reactContext ?: throw Exceptions.ReactContextLost()).contentResolver

  constructor(appContext: AppContext) {
    this.localAppContext = appContext;
    this.eventRecord = null
  }

  constructor(appContext: AppContext, eventRecord: EventRecord) {
    this.localAppContext = appContext;
    this.eventRecord = eventRecord
  }

  constructor(appContext: AppContext, cursor: Cursor) {
    this.localAppContext = appContext;



    // may be CalendarContract.Instances.BEGIN or CalendarContract.Events.DTSTART (which have different string values)
    val startDate = cursor.getString(3)
    val endDate = cursor.getString(4)

    val eventId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Instances.EVENT_ID)

    // unfortunately the string values of CalendarContract.Events._ID and CalendarContract.Instances._ID are equal
    // so we'll use the somewhat brittle column number from the query
    val instanceId = if (cursor.columnCount > 18) CalendarUtils.optStringFromCursor(cursor, CalendarContract.Instances._ID) else "";

    this.eventRecord = EventRecord(
      id = eventId,
      calendarId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.CALENDAR_ID),
      title = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.TITLE),
      notes = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.DESCRIPTION),
      alarms = if (eventId != null) serializeAlarms(eventId)?.toList() else null,
      recurrenceRule = extractRecurrenceRuleFromString(CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.RRULE)),
      startDate = CalendarNextUtils.dateToString(startDate.toLongOrNull()),
      endDate = CalendarNextUtils.dateToString(endDate.toLongOrNull()),
      allDay = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.ALL_DAY) != 0,
      location = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_LOCATION),
      availability = EventAvailability.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.AVAILABILITY)),
      timeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_TIMEZONE),
      endTimeZone = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.EVENT_END_TIMEZONE),
      status = EventStatus.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.STATUS)),
      organizerEmail = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.ORGANIZER),
      accessLevel = EventAccessLevel.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.ACCESS_LEVEL)),
      guestsCanModify = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_MODIFY) != 0,
      guestsCanInviteOthers = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0,
      guestsCanSeeGuests = CalendarUtils.optIntFromCursor(cursor, CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0,
      originalId = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Events.ORIGINAL_ID),
      instanceId = instanceId
    )
  }

  @Throws(EventNotSavedException::class, ParseException::class, SecurityException::class, InvalidArgumentException::class)
  fun saveEvent(eventRecord: EventRecord, calendarId: String? = null): Int? {
    val eventBuilder = CalendarEventBuilderNext()

    if (eventRecord.startDate != null) {
      val timeInMillis = CalendarNextUtils.dateToMilliseconds(eventRecord.startDate)
      if (timeInMillis != null) {
        eventBuilder.put(CalendarContract.Events.DTSTART, timeInMillis)
      }
    }

    if (eventRecord.endDate != null) {
      val timeInMillis = CalendarNextUtils.dateToMilliseconds(eventRecord.endDate)
      if (timeInMillis != null) {
        eventBuilder.put(CalendarContract.Events.DTEND, timeInMillis)
      }
    }

    if (eventRecord.title != null) {
      eventBuilder.put(CalendarContract.Events.TITLE, eventRecord.title)
    }

    if (eventRecord.allDay != null) {
      eventBuilder.put(CalendarContract.Events.ALL_DAY, if (eventRecord.allDay) 1 else 0)
    }

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
      eventBuilder.putNull(CalendarContract.Events.RRULE)
      eventBuilder.putNull(CalendarContract.Events.DURATION)
    }

    if (eventRecord.title != null) {
      eventBuilder.put(CalendarContract.Events.TITLE, eventRecord.title)
    }
    if (eventRecord.notes != null) {
      eventBuilder.put(CalendarContract.Events.DESCRIPTION, eventRecord.notes)
    }
    if (eventRecord.location != null) {
      eventBuilder.put(CalendarContract.Events.EVENT_LOCATION, eventRecord.location)
    }

    if (eventRecord.timeZone != null) {
      eventBuilder.put(CalendarContract.Events.EVENT_TIMEZONE, eventRecord.timeZone)
    } else {
      eventBuilder.put(CalendarContract.Events.EVENT_TIMEZONE, TimeZone.getDefault().id)
    }

    if (eventRecord.endTimeZone != null) {
      eventBuilder.put(CalendarContract.Events.EVENT_END_TIMEZONE, eventRecord.endTimeZone)
    } else {
      eventBuilder.put(CalendarContract.Events.EVENT_END_TIMEZONE, TimeZone.getDefault().id)
    }

    if (eventRecord.allDay != null) {
      eventBuilder.put(CalendarContract.Events.ALL_DAY, if (eventRecord.allDay) 1 else 0)
    }

    if (eventRecord.availability != null) {
      val availabilityValue = eventRecord.availability.toAndroidValue(eventRecord.availability)
      if (availabilityValue != null) {
        eventBuilder.put(CalendarContract.Events.AVAILABILITY, availabilityValue)
      }
    }

    if (eventRecord.status != null) {
      val statusValue = eventRecord.status.toAndroidValue(eventRecord.status)
      if (statusValue != null) {
        eventBuilder.put(CalendarContract.Events.STATUS, statusValue)
      }
    }

    if (eventRecord.organizerEmail != null) {
      eventBuilder.put(CalendarContract.Events.ORGANIZER, eventRecord.organizerEmail)
    }

    if (eventRecord.accessLevel != null) {
      val accessLevelValue = eventRecord.accessLevel.toAndroidValue(eventRecord.accessLevel)
      if (accessLevelValue != null) {
        eventBuilder.put(CalendarContract.Events.ACCESS_LEVEL, accessLevelValue)
      }
    }

    if (eventRecord.guestsCanModify != null) {
      eventBuilder.put(CalendarContract.Events.GUESTS_CAN_MODIFY, if (eventRecord.guestsCanModify) 1 else 0)
    }

    if (eventRecord.guestsCanInviteOthers != null) {
      eventBuilder.put(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS, if (eventRecord.guestsCanInviteOthers) 1 else 0)
    }

    if (eventRecord.guestsCanSeeGuests != null) {
      eventBuilder.put(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS, if (eventRecord.guestsCanSeeGuests) 1 else 0)
    }

    if (this.eventRecord?.id != null) {
      // Update current event
      val eventID = eventRecord.id?.toInt()
      if (eventID == null) {
        throw InvalidArgumentException("Event ID is required")
      }
      val updateUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      contentResolver.update(updateUri, eventBuilder.build(), null, null)
      removeRemindersForEvent(contentResolver, eventID)
      if (eventRecord.alarms != null) {
        createRemindersForEvent( eventID, eventRecord.alarms)
      }
      return eventID
    } else {
      // Create a new event
      if (calendarId == null) {
        throw InvalidArgumentException("CalendarId is required.")
      }
      eventBuilder.put(CalendarContract.Events.CALENDAR_ID, calendarId.toInt())
      val eventsUri = CalendarContract.Events.CONTENT_URI
      val eventUri = contentResolver.insert(eventsUri, eventBuilder.build())
        ?: throw EventNotSavedException()
      val eventID = eventUri.lastPathSegment!!.toInt()
      if (eventRecord.alarms != null) {
        createRemindersForEvent(eventID, eventRecord.alarms)
      }
      return eventID
    }
  }

  fun deleteEvent(recurringEventOptions: RecurringEventOptions): Boolean {
    val rows: Int
    val eventID = eventRecord?.id?.toInt()
    if (eventID == null) {
      throw InvalidArgumentException("Event ID is required")
    }
    if (recurringEventOptions.instanceStartDate == null) {
      val uri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, eventID.toLong())
      rows = contentResolver.delete(uri, null, null)
      if (rows > 0) {
        this.eventRecord = null
        return true;
      }
      return false;
    } else {
      // Get the exact occurrence and create an exception for it
      val exceptionValues = ContentValues()
      val startCal = Calendar.getInstance()
      val instanceStartDate = recurringEventOptions.instanceStartDate
      try {
        val parsedDate = sdf.parse(instanceStartDate)
        if (parsedDate != null) {
          startCal.time = parsedDate
          exceptionValues.put(CalendarContract.Events.ORIGINAL_INSTANCE_TIME, startCal.timeInMillis)
        } else {
          Log.e(TAG, "Parsed date is null")
          return false
        }
      } catch (e: ParseException) {
        Log.e(TAG, "error", e)
        throw e
      }
      exceptionValues.put(CalendarContract.Events.STATUS, CalendarContract.Events.STATUS_CANCELED)
      val exceptionUri = ContentUris.withAppendedId(CalendarContract.Events.CONTENT_EXCEPTION_URI, eventID.toLong())
      contentResolver.insert(exceptionUri, exceptionValues)
      return true
    }
  }

  private fun extractRecurrenceRuleFromString(rrule: String?): RecurrenceRuleRecord? {
    if (rrule == null) {
      return null
    }
    val ruleMap = mutableMapOf<String, String>()
    rrule.split(";").forEach { part ->
      val keyValue = part.split("=")
      if (keyValue.size == 2) {
        ruleMap[keyValue[0].uppercase(Locale.getDefault())] = keyValue[1]
      }
    }

    val frequency = ruleMap["FREQ"]?.lowercase(Locale.getDefault())
    val interval = ruleMap["INTERVAL"]?.toIntOrNull()
    var endDate: String? = null
    var occurrence: Int? = null

    ruleMap["UNTIL"]?.let { untilValue ->
      try {
        // Try to parse the UNTIL value using the known date format, fallback to raw string if parsing fails
        endDate = try {
          sdf.parse(untilValue)?.toString()
        } catch (e: ParseException) {
          Log.e(TAG, "Couldn't parse the `endDate` property.", e)
          untilValue
        }
      } catch (e: Exception) {
        Log.e(TAG, "endDate is null or invalid", e)
        endDate = untilValue
      }
    }

    ruleMap["COUNT"]?.let { countValue ->
      occurrence = countValue.toIntOrNull()
    }
    return RecurrenceRuleRecord(
      endDate = endDate,
      frequency = frequency,
      interval = interval,
      occurrence = occurrence,
    )
  }

  @Throws(SecurityException::class)
  private fun createRemindersForEvent(eventID: Int, reminders: List<AlarmRecord>) {
    for (reminder in reminders) {
      if (reminder.relativeOffset != null) {
        val minutes = -reminder.relativeOffset
        val reminderValues = ContentValues()
        val method = reminder.method?.toAndroidValue() ?: CalendarContract.Reminders.METHOD_DEFAULT
        reminderValues.put(CalendarContract.Reminders.EVENT_ID, eventID)
        reminderValues.put(CalendarContract.Reminders.MINUTES, minutes)
        reminderValues.put(CalendarContract.Reminders.METHOD, method)
        contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminderValues)
      }
    }
  }

  private fun serializeAlarms(eventId: String): ArrayList<AlarmRecord>? {
    val alarms = ArrayList<AlarmRecord>()
    val cursor = CalendarContract.Reminders.query(
      contentResolver,
      eventId.toLong(),
      arrayOf(
        CalendarContract.Reminders.MINUTES,
        CalendarContract.Reminders.METHOD
      )
    )
    while (cursor.moveToNext()) {
      val method = cursor.getInt(1)
      val thisAlarm = AlarmRecord(
        relativeOffset = -cursor.getInt(0),
        method = AlarmMethod.fromAndroidValue(method)
      )
      alarms.add(thisAlarm)
    }
    return alarms
  }

  fun getAttendees(): List<ExpoCalendarAttendee> {
    val eventID = eventRecord?.id?.toLong()
    if (eventID == null) {
      throw InvalidArgumentException("Event ID is required")
    }
    val cursor = CalendarContract.Attendees.query(
      contentResolver,
      eventID,
      findAttendeesByEventIdQueryParameters
    )
    return cursor.use { serializeExpoCalendarAttendees(it) }
  }

  private fun serializeExpoCalendarAttendees(cursor: Cursor): List<ExpoCalendarAttendee> {
    val results: MutableList<ExpoCalendarAttendee> = ArrayList()
    while (cursor.moveToNext()) {
      results.add(ExpoCalendarAttendee(localAppContext, cursor))
    }
    return results
  }

  fun createAttendee(attendeeRecord: AttendeeRecord): ExpoCalendarAttendee? {
    val attendee = ExpoCalendarAttendee(localAppContext)
    val eventId = this.eventRecord?.id?.toIntOrNull();
    if (eventId == null) {
      throw Exception("Missing event id")
    }
    val newEventId = attendee.saveAttendee(attendeeRecord, eventId)
    attendee.attendeeRecord = attendeeRecord
    attendee.attendeeRecord?.id = newEventId
    return attendee
  }
}
