package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.ExpoCalendarEventData
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventStatus
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.sdf

class ExpoCalendarEventMapper(private val reminderMapper: ReminderMapper) {
  fun toData(instanceEntity: InstanceEntity, reminders: List<ReminderEntity> = emptyList()) =
    ExpoCalendarEventData(
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
      availability = instanceEntity.availability?.toRecord(),
      organizerEmail = instanceEntity.organizer,
      accessLevel = instanceEntity.accessLevel?.toRecord(),
      guestsCanModify = instanceEntity.guestsCanModify,
      guestsCanInviteOthers = instanceEntity.guestsCanInviteOthers,
      guestsCanSeeGuests = instanceEntity.guestsCanSeeGuests,
      originalId = instanceEntity.originalId?.value?.toString(),
      instanceId = instanceEntity.id,
      recurrenceRule = instanceEntity.rrule?.let { RecurrenceRuleRecord.fromRrFormat(it.toRuleString()) },
      status = instanceEntity.status?.toRecord()
    )

  fun toData(eventEntity: EventEntity, reminders: List<ReminderEntity> = emptyList()) =
    ExpoCalendarEventData(
      id = eventEntity.id.value.toString(),
      alarms = reminders.map { reminderMapper.toRecord(it) },
      calendarId = eventEntity.calendarId?.value?.toString(),
      title = eventEntity.title,
      notes = eventEntity.description,
      startDate = sdf.format(eventEntity.dtStart ?: 0L),
      endDate = sdf.format(eventEntity.dtEnd ?: eventEntity.dtStart ?: 0L),
      allDay = eventEntity.allDay,
      location = eventEntity.eventLocation,
      timeZone = eventEntity.eventTimezone,
      endTimeZone = eventEntity.eventEndTimezone,
      availability = eventEntity.availability?.toRecord(),
      organizerEmail = eventEntity.organizer,
      accessLevel = eventEntity.accessLevel?.toRecord(),
      guestsCanModify = eventEntity.guestsCanModify,
      guestsCanInviteOthers = eventEntity.guestsCanInviteOthers,
      guestsCanSeeGuests = eventEntity.guestsCanSeeGuests,
      originalId = eventEntity.originalId?.value?.toString(),
      instanceId = null,
      recurrenceRule = eventEntity.rrule?.let { RecurrenceRuleRecord.fromRrFormat(it.toRuleString()) },
      status = eventEntity.status?.toRecord()
    )

  private fun Availability.toRecord() = when (this) {
    Availability.BUSY -> EventAvailability.BUSY
    Availability.FREE -> EventAvailability.FREE
    Availability.TENTATIVE -> EventAvailability.TENTATIVE
  }

  private fun AccessLevel.toRecord() = when (this) {
    AccessLevel.PUBLIC -> EventAccessLevel.PUBLIC
    AccessLevel.PRIVATE -> EventAccessLevel.PRIVATE
    AccessLevel.CONFIDENTIAL -> EventAccessLevel.CONFIDENTIAL
    AccessLevel.DEFAULT -> EventAccessLevel.DEFAULT
  }

  private fun Status.toRecord() = when (this) {
    Status.TENTATIVE -> EventStatus.TENTATIVE
    Status.CONFIRMED -> EventStatus.CONFIRMED
    Status.CANCELED -> EventStatus.CANCELED
  }
}
