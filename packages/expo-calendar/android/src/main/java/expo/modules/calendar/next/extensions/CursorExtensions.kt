package expo.modules.calendar.next.extensions

import android.content.ContentResolver
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.BEGIN_DATE_INDEX
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.AttendeeRole
import expo.modules.calendar.next.records.AttendeeStatus
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.EventStatus
import expo.modules.calendar.next.utils.dateToString
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.END_DATE_INDEX
import expo.modules.calendar.next.records.AlarmRecord
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.records.Source

fun Cursor.toCalendarRecord() : CalendarRecord {
  val accessLevel = optInt( CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)
  
  return CalendarRecord(
    id = optString( CalendarContract.Calendars._ID),
    title = optString( CalendarContract.Calendars.CALENDAR_DISPLAY_NAME),
    isPrimary = optInt( CalendarContract.Calendars.IS_PRIMARY) == 1,
    name = optString( CalendarContract.Calendars.NAME),
    color = optInt( CalendarContract.Calendars.CALENDAR_COLOR),
    ownerAccount = optString( CalendarContract.Calendars.OWNER_ACCOUNT),
    timeZone = optString( CalendarContract.Calendars.CALENDAR_TIME_ZONE),
    isVisible = optInt( CalendarContract.Calendars.VISIBLE) != 0,
    isSynced = optInt( CalendarContract.Calendars.SYNC_EVENTS) != 0,
    allowsModifications = isModificationAllowed(accessLevel),
    accessLevel = CalendarAccessLevel.fromAccessLevelString(optString( CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL)),
    allowedReminders = AlarmMethod.fromReminderString(optString( CalendarContract.Calendars.ALLOWED_REMINDERS)),
    allowedAttendeeTypes = AttendeeType.fromAttendeeTypesString(optString( CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES)),
    source = createSource(this)
  )
}

fun Cursor.toAttendeeRecord(): AttendeeRecord {
  return AttendeeRecord(
    id = optString( CalendarContract.Attendees._ID),
    name = optString( CalendarContract.Attendees.ATTENDEE_NAME),
    role = AttendeeRole.fromAndroidValue(optInt( CalendarContract.Attendees.ATTENDEE_RELATIONSHIP) ?: 0),
    status = AttendeeStatus.fromAndroidValue(optInt( CalendarContract.Attendees.ATTENDEE_STATUS) ?: 0),
    type = AttendeeType.fromAndroidValue(optInt( CalendarContract.Attendees.ATTENDEE_TYPE) ?: 0),
    email = optString( CalendarContract.Attendees.ATTENDEE_EMAIL)
  )
}

fun Cursor.toEventRecord(contentResolver: ContentResolver): EventRecord {
  val eventId = getEventId()
  val (startDate, endDate) = getEventDates()
  
  return EventRecord(
    id = eventId,
    calendarId = optString( CalendarContract.Events.CALENDAR_ID),
    title = optString( CalendarContract.Events.TITLE),
    notes = optString( CalendarContract.Events.DESCRIPTION),
    alarms = eventId?.let { serializeAlarms(contentResolver, it)?.toList() },
    recurrenceRule = RecurrenceRuleRecord.fromRrFormat(optString( CalendarContract.Events.RRULE)),
    startDate = dateToString(startDate?.toLongOrNull()),
    endDate = dateToString(endDate?.toLongOrNull()),
    allDay = optInt( CalendarContract.Events.ALL_DAY) != 0,
    location = optString( CalendarContract.Events.EVENT_LOCATION),
    availability = EventAvailability.fromAndroidValue(optInt( CalendarContract.Events.AVAILABILITY)),
    timeZone = optString( CalendarContract.Events.EVENT_TIMEZONE),
    endTimeZone = optString( CalendarContract.Events.EVENT_END_TIMEZONE),
    status = EventStatus.fromAndroidValue(optInt( CalendarContract.Events.STATUS) ?: 0),
    organizerEmail = optString( CalendarContract.Events.ORGANIZER),
    accessLevel = EventAccessLevel.fromAndroidValue(optInt( CalendarContract.Events.ACCESS_LEVEL) ?: 0),
    guestsCanModify = optInt( CalendarContract.Events.GUESTS_CAN_MODIFY) != 0,
    guestsCanInviteOthers = optInt( CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0,
    guestsCanSeeGuests = optInt(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0,
    originalId = optString( CalendarContract.Events.ORIGINAL_ID),
    instanceId = getInstanceId()
  )
}

private fun Cursor.optString(columnName: String): String? {
  val index = this.getColumnIndex(columnName)
  return if (index == -1) {
    null
  } else {
    this.getString(index)
  }
}

private fun Cursor.optInt(columnName: String): Int? {
  val index = this.getColumnIndex(columnName)
  return if (index == -1) {
    null
  } else {
    this.getInt(index)
  }
}

private fun Cursor.getEventId(): String? {
  return optString( CalendarContract.Instances.EVENT_ID)
    ?: optString( CalendarContract.Instances._ID)
}

private fun Cursor.getEventDates(): Pair<String?, String?> {
  val startDate = getString(BEGIN_DATE_INDEX)
  val endDate = getString(END_DATE_INDEX)
  return Pair(startDate, endDate)
}

private fun Cursor.getInstanceId(): String? {
  return optString( CalendarContract.Instances._ID)
}

private fun isModificationAllowed(accessLevel: Int?): Boolean {
  val allowedLevels = setOf(
    CalendarContract.Calendars.CAL_ACCESS_ROOT,
    CalendarContract.Calendars.CAL_ACCESS_OWNER,
    CalendarContract.Calendars.CAL_ACCESS_EDITOR,
    CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
  )
  return allowedLevels.contains(accessLevel)
}

private fun createSource(cursor: Cursor): Source {
  val accountName = cursor.optString(CalendarContract.Calendars.ACCOUNT_NAME)
  val accountType = cursor.optString(CalendarContract.Calendars.ACCOUNT_TYPE)

  return Source(
    id = accountName,
    type = accountType,
    name = accountName,
    isLocalAccount = accountType == CalendarContract.ACCOUNT_TYPE_LOCAL
  )
}

private fun serializeAlarms(contentResolver: ContentResolver, eventId: String): MutableList<AlarmRecord>? {
  val alarms = mutableListOf<AlarmRecord>()
  val projection = arrayOf(
    CalendarContract.Reminders.MINUTES,
    CalendarContract.Reminders.METHOD
  )
  val cursor = CalendarContract.Reminders.query(
    contentResolver,
    eventId.toLong(),
    projection
  )
  
  val minutesIndex = cursor.getColumnIndex(CalendarContract.Reminders.MINUTES)
  val methodIndex = cursor.getColumnIndex(CalendarContract.Reminders.METHOD)
  
  while (cursor.moveToNext()) {
    val method = cursor.getInt(methodIndex)
    val thisAlarm = AlarmRecord(
      // Android stores positive minutes, our API expects negative (before event)
      relativeOffset = -cursor.getInt(minutesIndex),
      method = AlarmMethod.fromAndroidValue(method)
    )
    alarms.add(thisAlarm)
  }
  return alarms
}