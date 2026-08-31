package expo.modules.calendar.next

import expo.modules.calendar.next.utils.DateTimeInput
import expo.modules.calendar.next.utils.getTimeInMillis
import expo.modules.calendar.next.domain.dto.event.EventExceptionInput
import kotlin.time.Duration.Companion.milliseconds
import expo.modules.calendar.next.domain.model.calendar.CalendarAccount
import expo.modules.calendar.next.domain.model.extendedproperty.ExtendedPropertyName
import expo.modules.calendar.next.domain.repositories.attendee.AttendeeRepository
import expo.modules.calendar.next.domain.repositories.calendar.CalendarRepository
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.extendedproperty.ExtendedPropertyRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.exceptions.AttendeeNotFoundException
import expo.modules.calendar.next.exceptions.CalendarNotFoundException
import expo.modules.calendar.next.exceptions.EventNotFoundException
import expo.modules.calendar.next.exceptions.ExtendedPropertyAccountMissingException
import expo.modules.calendar.next.exceptions.ExtendedPropertyNameNotSyncSafeException
import expo.modules.calendar.next.mappers.AttendeeMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ExpoCalendarEventMapper
import expo.modules.calendar.next.mappers.ExtendedPropertyMapper
import expo.modules.calendar.next.mappers.ReminderMapper
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.ExtendedPropertyRecord
import expo.modules.calendar.next.records.RecurringEventOptions
import expo.modules.kotlin.sharedobjects.SharedObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpoCalendarEvent(
  private val eventRepository: EventRepository,
  private val attendeeRepository: AttendeeRepository,
  private val calendarRepository: CalendarRepository,
  private val extendedPropertyRepository: ExtendedPropertyRepository,
  private val attendeeMapper: AttendeeMapper,
  private val eventMapper: EventMapper,
  private val reminderMapper: ReminderMapper,
  private val expoCalendarEventMapper: ExpoCalendarEventMapper,
  private val extendedPropertyMapper: ExtendedPropertyMapper,
  private val instanceRepository: InstanceRepository,
  private val reminderRepository: ReminderRepository,
  private var data: ExpoCalendarEventData?,
  val eventId: EventId,
  val options: RecurringEventOptions? = RecurringEventOptions()
) : SharedObject() {
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
    if (options?.futureEvents != true && options?.instanceStartDate != null) {
      eventRepository.insertException(eventId, EventExceptionInput.Cancellation(options.instanceStartDate.toLong().milliseconds))
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
    data = expoCalendarEventMapper.toData(updatedEvent, updatedReminders)
  }

  suspend fun getAttendees(): List<ExpoCalendarAttendee> = withContext(Dispatchers.IO) {
    runCatching {
      attendeeRepository.findAllByEventId(eventId)
        .map { ExpoCalendarAttendee(it, attendeeMapper, attendeeRepository) }
    }.getOrElse { throw AttendeeNotFoundException("Attendees could not be found", it) }
  }

  suspend fun getExtendedProperties(): List<ExtendedPropertyRecord> =
    extendedPropertyRepository.findAllByEventId(eventId)
      .mapNotNull { extendedPropertyMapper.toRecord(it) }

  suspend fun setExtendedProperty(name: String, value: String) {
    val account = requireOwningAccount()
    requireSyncSafeName(name, account)
    extendedPropertyRepository.upsert(eventId, account, extendedPropertyMapper.toInput(name, value))
    eventRepository.markDirty(eventId)
  }

  suspend fun deleteExtendedProperty(name: String): Boolean {
    val account = requireOwningAccount()
    val deleted = extendedPropertyRepository.deleteByName(eventId, account, name)
    if (deleted) {
      eventRepository.markDirty(eventId)
    }
    return deleted
  }

  /**
   * Resolves the account owning this event, which every write to the extended properties table has
   * to name.
   */
  private suspend fun requireOwningAccount(): CalendarAccount {
    val calendarId = eventRepository.findById(eventId)?.calendarId
      ?: throw EventNotFoundException(
        "Event ${eventId.value} was not found, so the calendar owning it could not be resolved"
      )
    val calendar = calendarRepository.findById(calendarId)
      ?: throw CalendarNotFoundException("Calendar ${calendarId.value} was not found")
    val accountName = calendar.accountName
    val accountType = calendar.accountType
    if (accountName == null || accountType == null) {
      throw ExtendedPropertyAccountMissingException(
        "Extended properties can't be written on this event, because calendar ${calendarId.value} names no account. " +
          "The calendar provider accepts writes to that table only from the sync adapter of the account owning the event, " +
          "and the write has to name that account. Use an event of a calendar that has an account instead."
      )
    }
    return CalendarAccount(name = accountName, type = accountType)
  }

  /**
   * Rejects names Google Calendar's sync adapter would drop.
   *
   * The prefix convention belongs to that adapter, not to the calendar provider, so it is enforced
   * on Google accounts only. Another adapter may keep an unprefixed name, and refusing the write
   * here would deny something that works.
   */
  private fun requireSyncSafeName(name: String, account: CalendarAccount) {
    if (!account.isGoogle || ExtendedPropertyName.isSyncSafe(name)) {
      return
    }
    throw ExtendedPropertyNameNotSyncSafeException(
      "Extended property name `$name` has no visibility prefix, and this event belongs to a Google account. " +
        "Google Calendar's sync adapter keeps only names prefixed `${ExtendedPropertyName.PRIVATE_PREFIX}` or " +
        "`${ExtendedPropertyName.SHARED_PREFIX}`, and drops the rest on the next sync without reporting an error, " +
        "so the value would be stored on the device and disappear later. " +
        "Use `${ExtendedPropertyName.PRIVATE_PREFIX}$name` to keep the value readable by the owning account only, " +
        "or `${ExtendedPropertyName.SHARED_PREFIX}$name` to share it with the guests of the event."
    )
  }

  fun getOccurrence(options: RecurringEventOptions?): ExpoCalendarEvent {
    if (options?.instanceStartDate == null) {
      return this
    }
    return ExpoCalendarEvent(
      eventRepository = eventRepository,
      attendeeRepository = attendeeRepository,
      calendarRepository = calendarRepository,
      extendedPropertyRepository = extendedPropertyRepository,
      attendeeMapper = attendeeMapper,
      eventMapper = eventMapper,
      reminderMapper = reminderMapper,
      expoCalendarEventMapper = expoCalendarEventMapper,
      extendedPropertyMapper = extendedPropertyMapper,
      instanceRepository = instanceRepository,
      reminderRepository = reminderRepository,
      data = data,
      eventId = eventId,
      options = options
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
      expoCalendarEventFactory: ExpoCalendarEventFactory
    ): ExpoCalendarEvent? {
      val eventId = EventId(eventId.toLong())
      val eventEntity = eventRepository.findById(eventId)
        ?: return null
      val reminders = reminderRepository.findAllByEventId(eventId)
      return expoCalendarEventFactory.create(
        eventEntity = eventEntity,
        reminders = reminders
      )
    }
  }
}
