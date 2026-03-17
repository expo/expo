package expo.modules.calendar.next

import expo.modules.calendar.extensions.DateTimeInput
import expo.modules.calendar.extensions.getTimeInMillis
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.repositories.calendar.CalendarRepository
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.dto.event.EventInput
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.exceptions.CalendarNotSupportedException
import expo.modules.calendar.next.exceptions.EventsCouldNotBeCreatedException
import expo.modules.calendar.next.mappers.CalendarMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ReminderMapper
import expo.modules.calendar.next.records.AlarmRecord
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.domain.dto.calendar.CalendarUpdate
import expo.modules.calendar.next.records.CalendarUpdateRecord
import expo.modules.calendar.next.records.EventRecord
import expo.modules.kotlin.sharedobjects.SharedObject

class ExpoCalendar(
  calendarEntity: CalendarEntity,
  private val calendarRepository: CalendarRepository,
  private val eventRepository: EventRepository,
  private val reminderRepository: ReminderRepository,
  private val instanceRepository: InstanceRepository,
  private val eventFactory: ExpoCalendarEventFactory,
  private val eventMapper: EventMapper,
  private val calendarMapper: CalendarMapper,
  private val reminderMapper: ReminderMapper
) : SharedObject() {
  val id get() = data?.id
  val title get() = data?.title
  val name get() = data?.name
  val source get() = data?.source
  val color get() = data?.color
  val isVisible get() = data?.isVisible
  val isSynced get() = data?.isSynced
  val timeZone get() = data?.timeZone
  val isPrimary get() = data?.isPrimary
  val allowsModifications get() = data?.allowsModifications
  val allowedAvailabilities get() = data?.allowedAvailabilities
  val allowedReminders get() = data?.allowedReminders
  val allowedAttendeeTypes get() = data?.allowedAttendeeTypes
  val ownerAccount get() = data?.ownerAccount
  val accessLevel get() = data?.accessLevel

  private val calendarId = calendarEntity.id

  // Grouped data object to avoid manual reassignment of each field on update, reload or clear
  private var data: ExpoCalendarData? = calendarMapper.toExpoCalendarData(calendarEntity)

  suspend fun getEvents(startDate: DateTimeInput, endDate: DateTimeInput): List<ExpoCalendarEvent> =
    instanceRepository.findAll(
      startDate = startDate.getTimeInMillis(),
      endDate = endDate.getTimeInMillis(),
      calendars = listOf(calendarId)
    ).map { eventFactory.create(it) }

  suspend fun delete() {
    calendarRepository.delete(calendarId)
    data = null
  }

  suspend fun createEvent(record: EventRecord.New): ExpoCalendarEvent {
    try {
      val eventInput = eventMapper.toDomainEventInput(calendarId, record)
      val eventId = EventId(eventRepository.insert(eventInput))
      insertReminders(eventId, record.alarms)
      return buildExpoCalendarEvent(eventId, eventInput)
    } catch (e: Exception) {
      throw EventsCouldNotBeCreatedException("Event could not be created", e)
    }
  }

  private suspend fun insertReminders(eventId: EventId, alarms: List<AlarmRecord>?) {
    alarms?.forEach { alarm ->
      val reminderInput = reminderMapper.toDomain(alarm)
      reminderRepository.create(eventId, reminderInput)
    }
  }

  private suspend fun buildExpoCalendarEvent(eventId: EventId, eventInput: EventInput): ExpoCalendarEvent {
    val reminders = reminderRepository.findAllByEventId(eventId)
    val instanceEntity = eventMapper.toInstanceEntity(eventInput.toExistingEntity(eventId))
    return eventFactory.create(
      instanceEntity = instanceEntity,
      reminders = reminders
    )
  }

  suspend fun update(updateRecord: CalendarUpdateRecord) {

    calendarRepository.update(calendarId, CalendarUpdate(
      name = updateRecord.name,
      calendarDisplayName = updateRecord.title,
      calendarColor = updateRecord.color,
      visible = updateRecord.isVisible,
      syncEvents = updateRecord.isSynced,
      calendarTimeZone = updateRecord.timeZone
    ))
    reloadProperties()
  }

  private suspend fun reloadProperties() {
    data = calendarRepository.findById(calendarId)?.let { calendarMapper.toExpoCalendarData(it) }
      ?: throw IllegalStateException("Calendar not found during reload")
  }

  companion object {
    suspend fun create(
      calendarRecord: CalendarRecord.New,
      calendarMapper: CalendarMapper,
      calendarRepository: CalendarRepository,
      calendarFactory: ExpoCalendarFactory
    ): ExpoCalendar {
      val calendarInput = calendarMapper.toCalendarInput(calendarRecord)
      val calendarId = calendarRepository.insert(calendarInput)
      val existingCalendarEntity = calendarInput.toCalendarEntity(calendarId)
      return calendarFactory.create(existingCalendarEntity)
    }

    suspend fun getAll(
      type: String?,
      calendarRepository: CalendarRepository,
      expoCalendarFactory: ExpoCalendarFactory
    ): List<ExpoCalendar> {
      if (type == "reminder") {
        throw CalendarNotSupportedException("Calendars of type `reminder` are not supported on Android")
      }
      return calendarRepository
        .findAll()
        .map { calendarEntity -> expoCalendarFactory.create(calendarEntity) }
    }

    suspend fun getById(
      calendarId: String,
      calendarRepository: CalendarRepository,
      calendarFactory: ExpoCalendarFactory
    ): ExpoCalendar? {
      val calendarEntity = calendarRepository.findById(CalendarId(calendarId.toLong()))
        ?: return null
      return calendarFactory.create(calendarEntity)
    }
  }
}
