package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.dto.event.EventInput
import expo.modules.calendar.next.domain.dto.event.EventUpdate
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.dateToMilliseconds
import expo.modules.calendar.next.utils.sdf
import expo.modules.kotlin.types.ValueOrUndefined
import java.util.Date

class EventMapper {
  fun toEventUpdate(eventRecord: EventRecord) = when (eventRecord) {
    is EventRecord.New -> eventRecord.toEventUpdate()
    is EventRecord.Existing -> eventRecord.toEventUpdate()
  }

  fun toEventUpdate(input: EventUpdateRecord) = input.toEventUpdate()

  fun toDomainEventInput(calendarId: CalendarId, eventRecord: EventRecord.New) = EventInput(
    calendarId = calendarId,
    title = eventRecord.title,
    description = eventRecord.notes,
    dtStart = dateToMilliseconds(eventRecord.startDate),
    dtEnd = dateToMilliseconds(eventRecord.endDate),
    availability = eventRecord.availability?.let {
      when (it) {
        EventAvailability.BUSY -> Availability.BUSY
        EventAvailability.FREE -> Availability.FREE
        EventAvailability.TENTATIVE -> Availability.TENTATIVE
      }
    },
    allDay = eventRecord.allDay,
    eventLocation = eventRecord.location,
    organizer = eventRecord.organizerEmail,
    guestsCanModify = eventRecord.guestsCanModify,
    guestsCanInviteOthers = eventRecord.guestsCanInviteOthers,
    guestsCanSeeGuests = eventRecord.guestsCanSeeGuests,
    eventTimezone = eventRecord.timeZone,
    eventEndTimezone = eventRecord.endTimeZone,
    accessLevel = eventRecord.accessLevel?.let {
      when (it) {
        EventAccessLevel.PUBLIC -> AccessLevel.PUBLIC
        EventAccessLevel.PRIVATE -> AccessLevel.PRIVATE
        EventAccessLevel.CONFIDENTIAL -> AccessLevel.CONFIDENTIAL
        EventAccessLevel.DEFAULT -> AccessLevel.DEFAULT
      }
    },
    rrule = eventRecord.recurrenceRule?.let {
      RecurrenceRule(
        frequency = it.frequency ?: "",
        interval = it.interval,
        occurrence = it.occurrence,
        endDate = it.endDate
      )
    }
  )

  fun toInstanceEntity(eventRecord: EventRecord.Existing) = InstanceEntity(
    id = eventRecord.instanceId?.toLong()
      ?: throw IllegalStateException("instanceId must not be null for existing event record"),
    accessLevel = eventRecord.accessLevel?.let { al ->
      AccessLevel.entries.find { it.name == al.name }
    },
    allDay = eventRecord.allDay,
    availability = eventRecord.availability?.let { av ->
      when (av) {
        EventAvailability.BUSY -> Availability.BUSY
        EventAvailability.FREE -> Availability.FREE
        EventAvailability.TENTATIVE -> Availability.TENTATIVE
      }
    },
    begin = dateToMilliseconds(eventRecord.startDate) ?: 0L,
    calendarId = CalendarId(
      eventRecord.calendarId?.toLong()
        ?: throw IllegalStateException("calendarId must not be null for existing event record")
    ),
    description = eventRecord.notes,
    end = dateToMilliseconds(eventRecord.endDate) ?: 0L,
    eventEndTimezone = eventRecord.endTimeZone,
    eventId = EventId(eventRecord.id.toLong()),
    eventLocation = eventRecord.location,
    eventTimezone = eventRecord.timeZone,
    guestsCanInviteOthers = eventRecord.guestsCanInviteOthers,
    guestsCanModify = eventRecord.guestsCanModify,
    guestsCanSeeGuests = eventRecord.guestsCanSeeGuests,
    organizer = eventRecord.organizerEmail,
    originalId = eventRecord.originalId?.let {
      EventId(it.toLong())
    },
    rrule = eventRecord.recurrenceRule?.let {
      RecurrenceRule(
        frequency = it.frequency ?: "",
        interval = it.interval,
        occurrence = it.occurrence,
        endDate = it.endDate
      )
    },
    title = eventRecord.title
  )

  fun toInstanceEntity(entity: EventEntity) = InstanceEntity(
    accessLevel = entity.accessLevel,
    allDay = entity.allDay,
    availability = entity.availability,
    begin = entity.dtStart ?: 0L,
    calendarId = entity.calendarId,
    description = entity.description,
    end = entity.dtEnd ?: 0L,
    eventEndTimezone = entity.eventEndTimezone,
    eventId = entity.id,
    eventLocation = entity.eventLocation,
    eventTimezone = entity.eventTimezone,
    guestsCanInviteOthers = entity.guestsCanInviteOthers,
    guestsCanModify = entity.guestsCanModify,
    guestsCanSeeGuests = entity.guestsCanSeeGuests,
    organizer = entity.organizer,
    originalId = entity.originalId,
    rrule = entity.rrule,
    title = entity.title,
    id = 0L,
    status = entity.status
  )

  fun toDomain(eventRecord: EventRecord.Existing) = EventEntity(
    id = EventId(eventRecord.id.toLong()),
    accessLevel = eventRecord.accessLevel?.let { al ->
      AccessLevel.entries.find { it.name == al.name }
    },
    allDay = eventRecord.allDay,
    availability = eventRecord.availability?.let { av ->
      when (av) {
        EventAvailability.BUSY -> Availability.BUSY
        EventAvailability.FREE -> Availability.FREE
        EventAvailability.TENTATIVE -> Availability.TENTATIVE
      }
    },
    calendarId = eventRecord.calendarId?.let {
      CalendarId(it.toLong())
    },
    description = eventRecord.notes,
    dtEnd = dateToMilliseconds(eventRecord.endDate),
    dtStart = dateToMilliseconds(eventRecord.startDate),
    eventEndTimezone = eventRecord.endTimeZone,
    eventLocation = eventRecord.location,
    eventTimezone = eventRecord.timeZone,
    guestsCanInviteOthers = eventRecord.guestsCanInviteOthers,
    guestsCanModify = eventRecord.guestsCanModify,
    guestsCanSeeGuests = eventRecord.guestsCanSeeGuests,
    organizer = eventRecord.organizerEmail,
    originalId = eventRecord.originalId?.let {
      EventId(it.toLong())
    },
    rrule = eventRecord.recurrenceRule?.let {
      RecurrenceRule(
        frequency = it.frequency ?: "",
        interval = it.interval,
        occurrence = it.occurrence,
        endDate = it.endDate
      )
    },
    title = eventRecord.title
  )
}

private fun millisToDateString(millis: Long): String =
  sdf.format(Date(millis))

private fun RecurrenceRule.toRecord() = RecurrenceRuleRecord.fromRrFormat(toRuleString())

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
  frequency = frequency ?: "",
  interval = interval,
  occurrence = occurrence,
  endDate = endDate
)

private fun EventUpdateRecord.toEventUpdate() = EventUpdate(
  title = title,
  description = notes,
  dtStart = if (startDate.isUndefined) ValueOrUndefined.Undefined() else ValueOrUndefined.Value(dateToMilliseconds(startDate.optional)),
  dtEnd = if (endDate.isUndefined) ValueOrUndefined.Undefined() else ValueOrUndefined.Value(dateToMilliseconds(endDate.optional)),
  availability = if (availability.isUndefined) ValueOrUndefined.Undefined() else ValueOrUndefined.Value(availability.optional?.toDomain()),
  allDay = allDay,
  eventLocation = location,
  organizer = organizerEmail,
  guestsCanModify = guestsCanModify,
  guestsCanInviteOthers = guestsCanInviteOthers,
  guestsCanSeeGuests = guestsCanSeeGuests,
  eventTimezone = timeZone,
  eventEndTimezone = endTimeZone,
  accessLevel = if (accessLevel.isUndefined) ValueOrUndefined.Undefined() else ValueOrUndefined.Value(accessLevel.optional?.toDomain()),
  rrule = if (recurrenceRule.isUndefined) ValueOrUndefined.Undefined() else ValueOrUndefined.Value(recurrenceRule.optional?.toDomain())
)

private fun EventRecord.New.toEventUpdate() = EventUpdate(
  title = ValueOrUndefined.Value(title),
  description = ValueOrUndefined.Value(notes),
  dtStart = ValueOrUndefined.Value(dateToMilliseconds(startDate)),
  dtEnd = ValueOrUndefined.Value(dateToMilliseconds(endDate)),
  availability = ValueOrUndefined.Value(availability?.toDomain()),
  allDay = ValueOrUndefined.Value(allDay),
  eventLocation = ValueOrUndefined.Value(location),
  organizer = ValueOrUndefined.Value(organizerEmail),
  guestsCanModify = ValueOrUndefined.Value(guestsCanModify),
  guestsCanInviteOthers = ValueOrUndefined.Value(guestsCanInviteOthers),
  guestsCanSeeGuests = ValueOrUndefined.Value(guestsCanSeeGuests),
  eventTimezone = ValueOrUndefined.Value(timeZone),
  eventEndTimezone = ValueOrUndefined.Value(endTimeZone),
  accessLevel = ValueOrUndefined.Value(accessLevel?.toDomain()),
  rrule = ValueOrUndefined.Value(recurrenceRule?.toDomain())
)

private fun EventRecord.Existing.toEventUpdate() = EventUpdate(
  title = ValueOrUndefined.Value(title),
  description = ValueOrUndefined.Value(notes),
  dtStart = ValueOrUndefined.Value(dateToMilliseconds(startDate)),
  dtEnd = ValueOrUndefined.Value(dateToMilliseconds(endDate)),
  availability = ValueOrUndefined.Value(availability?.toDomain()),
  allDay = ValueOrUndefined.Value(allDay),
  eventLocation = ValueOrUndefined.Value(location),
  organizer = ValueOrUndefined.Value(organizerEmail),
  guestsCanModify = ValueOrUndefined.Value(guestsCanModify),
  guestsCanInviteOthers = ValueOrUndefined.Value(guestsCanInviteOthers),
  guestsCanSeeGuests = ValueOrUndefined.Value(guestsCanSeeGuests),
  eventTimezone = ValueOrUndefined.Value(timeZone),
  eventEndTimezone = ValueOrUndefined.Value(endTimeZone),
  accessLevel = ValueOrUndefined.Value(accessLevel?.toDomain()),
  rrule = ValueOrUndefined.Value(recurrenceRule?.toDomain())
)
