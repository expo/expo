package expo.modules.calendar.next

import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.extensions.getTimeInMillis
import expo.modules.calendar.next.domain.dto.event.EventExceptionInput
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.repositories.attendee.AttendeeRepository
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.exceptions.AttendeeNotFoundException
import expo.modules.calendar.next.mappers.AttendeeMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ExpoCalendarEventData
import expo.modules.calendar.next.mappers.ExpoCalendarEventMapper
import expo.modules.calendar.next.mappers.ReminderMapper
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpoCalendarEvent(
  val eventRepository: EventRepository,
  val attendeeRepository: AttendeeRepository,
  val attendeeMapper: AttendeeMapper,
  val eventMapper: EventMapper,
  val reminderMapper: ReminderMapper,
  val instanceRepository: InstanceRepository,
  val reminderRepository: ReminderRepository,
  val options: RecurringEventOptions? = RecurringEventOptions(),
  private val initialInstanceEntity: InstanceEntity,
  reminders: List<ReminderEntity> = emptyList()
) : SharedObject() {
  private val expoCalendarEventMapper = ExpoCalendarEventMapper(reminderMapper)

  // Grouped data object to avoid manual reassignment of each field on update, reload or clear
  private var data: ExpoCalendarEventData? = expoCalendarEventMapper.toData(initialInstanceEntity, reminders)
  private val eventId = initialInstanceEntity.eventId

  val id get() = data?.id
  val calendarId get() = data?.calendarId
  val title get() = data?.title
  val notes get() = data?.notes
  val startDate get() = data?.startDate
  val endDate get() = data?.endDate
  val allDay get() = data?.allDay
  val location get() = data?.location
  val timeZone get() = data?.timeZone
  val endTimeZone get() = data?.endTimeZone
  val availability get() = data?.availability
  val status get() = data?.status
  val organizerEmail get() = data?.organizerEmail
  val accessLevel get() = data?.accessLevel
  val guestsCanModify get() = data?.guestsCanModify
  val guestsCanInviteOthers get() = data?.guestsCanInviteOthers
  val guestsCanSeeGuests get() = data?.guestsCanSeeGuests
  val originalId get() = data?.originalId
  val instanceId get() = data?.instanceId
  val recurrenceRule get() = data?.recurrenceRule
  val alarms get() = data?.alarms

  suspend fun createAttendee(attendeeRecord: AttendeeRecord): ExpoCalendarAttendee {
    val entity = attendeeMapper.toAttendeeInput(attendeeRecord, eventId)
    val newId = attendeeRepository.create(entity)
    val createdEntity = attendeeRepository.findById(newId)
      ?: throw AttendeeNotFoundException("Attendee not found after creation")
    return ExpoCalendarAttendee(createdEntity, attendeeMapper, attendeeRepository)
  }

  suspend fun delete() {
    if ((options?.futureEvents == null || options.futureEvents == false) && options?.instanceStartDate != null) {
      eventRepository.insertException(eventId, EventExceptionInput.Cancellation(options.instanceStartDate.toLong()))
    } else {
      eventRepository.remove(eventId)
    }
    data = null
  }

  suspend fun update(eventUpdateRecord: EventUpdateRecord) {
    val eventUpdate = eventMapper.toEventUpdate(eventUpdateRecord)
    eventRepository.update(eventId, eventUpdate)
    if (!eventUpdateRecord.alarms.isUndefined) {
      reminderRepository.deleteAllByEventId(eventId)
      eventUpdateRecord.alarms.optional?.forEach { alarm ->
        reminderRepository.create(eventId, reminderMapper.toDomain(alarm))
      }
    }
    val updatedEvent = eventRepository.findById(eventId)
      ?: throw IllegalStateException("Event not found after update")
    val updatedReminders = reminderRepository.findAllByEventId(eventId)
    data = eventMapper.toInstanceEntity(updatedEvent)
      .let { expoCalendarEventMapper.toData(it, updatedReminders) }
  }

  suspend fun getAttendees(): List<ExpoCalendarAttendee> = withContext(Dispatchers.IO) {
    try {
      attendeeRepository.findAllByEventId(eventId)
        .map { ExpoCalendarAttendee(it, attendeeMapper, attendeeRepository) }
    } catch (e: Exception) {
      throw AttendeeNotFoundException("Attendees could not be found", e)
    }
  }

  fun getOccurrence(options: RecurringEventOptions?): ExpoCalendarEvent {
    if (options?.instanceStartDate == null) {
      return this
    }
    return ExpoCalendarEvent(
      eventRepository,
      attendeeRepository,
      attendeeMapper,
      eventMapper,
      reminderMapper,
      instanceRepository,
      reminderRepository,
      options,
      initialInstanceEntity
    )
  }

  companion object {
    suspend fun findAll(
      instanceRepository: InstanceRepository,
      startDate: DateTimeInput,
      endDate: DateTimeInput,
      calendarIds: List<String>,
      reminderRepository: ReminderRepository,
      expoCalendarEventFactory: ExpoCalendarEventFactory
    ): List<ExpoCalendarEvent> =
      instanceRepository.findAll(
        startDate.getTimeInMillis(),
        endDate.getTimeInMillis(),
        calendarIds.map { CalendarId(it.toLong()) }
      ).map { instanceEntity ->
        val reminders = reminderRepository.findAllByEventId(instanceEntity.eventId)
        expoCalendarEventFactory.create(
          instanceEntity = instanceEntity,
          reminders = reminders
        )
      }

    suspend fun findById(
      eventId: String,
      eventRepository: EventRepository,
      reminderRepository: ReminderRepository,
      eventMapper: EventMapper,
      expoCalendarEventFactory: ExpoCalendarEventFactory
    ): ExpoCalendarEvent? {
      val eventId = EventId(eventId.toLong())
      val eventEntity = eventRepository.findById(eventId)
        ?: return null
      val reminders = reminderRepository.findAllByEventId(eventId)
      val instanceEntity = eventMapper.toInstanceEntity(eventEntity)
      return expoCalendarEventFactory.create(
        instanceEntity = instanceEntity,
        reminders = reminders
      )
    }
  }
}
