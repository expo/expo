package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.records.AlarmRecord
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventStatus
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.sdf

class ExpoCalendarEventMapper(private val reminderMapper: ReminderMapper) {
  fun toData(instanceEntity: InstanceEntity, reminders: List<ReminderEntity> = emptyList()) = ExpoCalendarEventData(
    id = instanceEntity.eventId.value.toString(),
    alarms = reminders.map { reminderMapper.toRecord(it) },
    calendarId = instanceEntity.calendarId?.value?.toString(),
    title = instanceEntity.title,
    notes = instanceEntity.description,
    startDate = sdf.format(instanceEntity.begin),
    endDate = sdf.format(instanceEntity.end),
    allDay = instanceEntity.allDay,
    location = instanceEntity.eventLocation,
    timeZone = instanceEntity.eventTimezone,
    endTimeZone = instanceEntity.eventEndTimezone,
    availability = instanceEntity.availability?.let { EventAvailability.fromAndroidValue(it.value) },
    organizerEmail = instanceEntity.organizer,
    accessLevel = instanceEntity.accessLevel?.let { EventAccessLevel.fromAndroidValue(it.value) },
    guestsCanModify = instanceEntity.guestsCanModify,
    guestsCanInviteOthers = instanceEntity.guestsCanInviteOthers,
    guestsCanSeeGuests = instanceEntity.guestsCanSeeGuests,
    originalId = instanceEntity.originalId?.value?.toString(),
    instanceId = instanceEntity.id,
    recurrenceRule = instanceEntity.rrule?.let { RecurrenceRuleRecord.fromRrFormat(it.toRuleString()) },
    status = instanceEntity.status?.let { EventStatus.fromAndroidValue(it.value) }
  )
}

data class ExpoCalendarEventData(
  val id: String,
  val alarms: List<AlarmRecord>,
  val calendarId: String?,
  val title: String?,
  val notes: String?,
  val startDate: String,
  val endDate: String,
  val allDay: Boolean?,
  val location: String?,
  val timeZone: String?,
  val endTimeZone: String?,
  val availability: EventAvailability?,
  val organizerEmail: String?,
  val accessLevel: EventAccessLevel?,
  val guestsCanModify: Boolean?,
  val guestsCanInviteOthers: Boolean?,
  val guestsCanSeeGuests: Boolean?,
  val originalId: String?,
  val instanceId: Long,
  val recurrenceRule: RecurrenceRuleRecord?,
  val status: EventStatus?
)
