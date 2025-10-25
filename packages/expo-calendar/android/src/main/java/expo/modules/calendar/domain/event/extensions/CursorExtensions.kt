package expo.modules.calendar.domain.event.extensions

import android.content.ContentResolver
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.domain.event.enums.AlarmMethod
import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.calendar.domain.event.enums.EventAccessLevel
import expo.modules.calendar.domain.event.records.Alarm
import expo.modules.calendar.domain.event.records.EventEntity
import expo.modules.calendar.domain.event.records.RecurrenceRuleEntity
import expo.modules.calendar.extensions.getIntOrDefault
import expo.modules.calendar.extensions.getOptionalString
import java.util.Calendar

fun Cursor.extractAlarm(): Alarm {
  val minutesIndex = getColumnIndexOrThrow(CalendarContract.Reminders.MINUTES)
  val methodIndex = getColumnIndexOrThrow(CalendarContract.Reminders.METHOD)

  return Alarm(
    relativeOffset = -getInt(minutesIndex),
    method = AlarmMethod.fromContentProviderValue(getInt(methodIndex))
  )
}

fun Cursor.extractEvent(contentResolver: ContentResolver): EventEntity {
  // may be CalendarContract.Instances.BEGIN or CalendarContract.Events.DTSTART (which have different string values)
  val startDate = getString(3)?.let {
    val foundStartDate = Calendar.getInstance().apply { timeInMillis = it.toLong() }
    CalendarUtils.sdf.format(foundStartDate.time)
  } ?: ""

  // may be CalendarContract.Instances.END or CalendarContract.Events.DTEND (which have different string values)
  val endDate = getString(4)?.let {
    val foundEndDate = Calendar.getInstance().apply { timeInMillis = it.toLong() }
    CalendarUtils.sdf.format(foundEndDate.time)
  } ?: ""

  val availabilityValue = getIntOrDefault(CalendarContract.Events.AVAILABILITY)
  val accessLeveLValue = getIntOrDefault(CalendarContract.Events.ACCESS_LEVEL)
  val instanceId = takeIf { it.columnCount > 18 }?.getString(18)

  val recurrenceRule = getOptionalString(CalendarContract.Events.RRULE)?.let {
    RecurrenceRuleEntity.fromRuleString(it)
  }

  val eventID = getString(0)
  return EventEntity(
    id = eventID,
    calendarId = getOptionalString(CalendarContract.Events.CALENDAR_ID),
    title = getOptionalString(CalendarContract.Events.TITLE),
    notes = getOptionalString(CalendarContract.Events.DESCRIPTION),
    startDate = startDate,
    endDate = endDate,
    alarms = getAlarmsForEvent(contentResolver, eventID.toLong()),
    availability = Availability.fromContentProviderValue(availabilityValue),
    allDay = getIntOrDefault(CalendarContract.Events.ALL_DAY) != 0,
    location = getOptionalString(CalendarContract.Events.EVENT_LOCATION),
    organizerEmail = getOptionalString(CalendarContract.Events.ORGANIZER),
    guestsCanModify = getIntOrDefault(CalendarContract.Events.GUESTS_CAN_MODIFY) != 0,
    guestsCanInviteOthers = getIntOrDefault(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS) != 0,
    guestsCanSeeGuests = getIntOrDefault(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS) != 0,
    timeZone = getOptionalString(CalendarContract.Events.EVENT_TIMEZONE),
    endTimeZone = getOptionalString(CalendarContract.Events.EVENT_END_TIMEZONE),
    accessLevel = EventAccessLevel.fromContentProviderValue(accessLeveLValue),
    recurrenceRule = recurrenceRule,
    originalId = getOptionalString(CalendarContract.Events.ORIGINAL_ID),
    instanceId = instanceId
  )
}

private fun getAlarmsForEvent(contentResolver: ContentResolver, eventID: Long): List<Alarm> {
  val alarms = mutableListOf<Alarm>()
  val cursor = CalendarContract.Reminders.query(
    contentResolver,
    eventID,
    arrayOf(
      CalendarContract.Reminders.MINUTES,
      CalendarContract.Reminders.METHOD
    )
  )
  while (cursor.moveToNext()) {
    alarms.add(cursor.extractAlarm())
  }
  return alarms
}
