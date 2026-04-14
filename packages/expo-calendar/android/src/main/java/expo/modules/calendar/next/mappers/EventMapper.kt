package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.dto.event.EventInput
import expo.modules.calendar.next.domain.dto.event.EventUpdate
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventInputRecord
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.toMilliseconds
import expo.modules.kotlin.types.map

class EventMapper {
  fun toEventUpdate(input: EventUpdateRecord) = EventUpdate(
    title = input.title,
    description = input.notes,
    dtStart = input.startDate.map { it.toMilliseconds() },
    dtEnd = input.endDate.map { it.toMilliseconds() },
    availability = input.availability.map { it?.toDomain() },
    allDay = input.allDay,
    eventLocation = input.location,
    organizer = input.organizerEmail,
    guestsCanModify = input.guestsCanModify,
    guestsCanInviteOthers = input.guestsCanInviteOthers,
    guestsCanSeeGuests = input.guestsCanSeeGuests,
    eventTimezone = input.timeZone,
    eventEndTimezone = input.endTimeZone,
    accessLevel = input.accessLevel.map { it?.toDomain() },
    rrule = input.recurrenceRule.map { it?.toDomain() }
  )

  fun toEventInput(calendarId: CalendarId, eventRecord: EventInputRecord) = EventInput(
    calendarId = calendarId,
    title = eventRecord.title,
    description = eventRecord.notes,
    dtStart = eventRecord.startDate.toMilliseconds(),
    dtEnd = eventRecord.endDate.toMilliseconds(),
    availability = eventRecord.availability?.toDomain(),
    allDay = eventRecord.allDay,
    eventLocation = eventRecord.location,
    organizer = eventRecord.organizerEmail,
    guestsCanModify = eventRecord.guestsCanModify,
    guestsCanInviteOthers = eventRecord.guestsCanInviteOthers,
    guestsCanSeeGuests = eventRecord.guestsCanSeeGuests,
    eventTimezone = eventRecord.timeZone,
    eventEndTimezone = eventRecord.endTimeZone,
    accessLevel = eventRecord.accessLevel?.toDomain(),
    rrule = eventRecord.recurrenceRule?.toDomain()
  )

  private fun EventAvailability.toDomain() = when (this) {
    EventAvailability.BUSY -> Availability.BUSY
    EventAvailability.FREE -> Availability.FREE
    EventAvailability.TENTATIVE -> Availability.TENTATIVE
  }

  private fun EventAccessLevel.toDomain() = when (this) {
    EventAccessLevel.PUBLIC -> AccessLevel.PUBLIC
    EventAccessLevel.PRIVATE -> AccessLevel.PRIVATE
    EventAccessLevel.CONFIDENTIAL -> AccessLevel.CONFIDENTIAL
    EventAccessLevel.DEFAULT -> AccessLevel.DEFAULT
  }

  private fun RecurrenceRuleRecord.toDomain() = RecurrenceRule(
    frequency = frequency
      ?: throw IllegalArgumentException("Frequency is required for recurrence rule"),
    interval = interval,
    occurrence = occurrence,
    endDate = endDate
  )
}
