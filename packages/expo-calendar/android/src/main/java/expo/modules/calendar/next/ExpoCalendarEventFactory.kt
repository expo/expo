package expo.modules.calendar.next

import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.repositories.attendee.AttendeeRepository
import expo.modules.calendar.next.domain.repositories.calendar.CalendarRepository
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.extendedproperty.ExtendedPropertyRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.mappers.AttendeeMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ExpoCalendarEventMapper
import expo.modules.calendar.next.mappers.ExtendedPropertyMapper
import expo.modules.calendar.next.mappers.ReminderMapper

class ExpoCalendarEventFactory(
  private val eventRepository: EventRepository,
  private val instanceRepository: InstanceRepository,
  private val attendeeRepository: AttendeeRepository,
  private val calendarRepository: CalendarRepository,
  private val extendedPropertyRepository: ExtendedPropertyRepository,
  private val eventMapper: EventMapper,
  private val attendeeMapper: AttendeeMapper,
  private val reminderMapper: ReminderMapper,
  private val extendedPropertyMapper: ExtendedPropertyMapper,
  private val reminderRepository: ReminderRepository
) {
  private val expoCalendarEventMapper = ExpoCalendarEventMapper(reminderMapper)

  fun create(
    instanceEntity: InstanceEntity,
    reminders: List<ReminderEntity> = emptyList()
  ) = ExpoCalendarEvent(
    eventRepository = eventRepository,
    attendeeRepository = attendeeRepository,
    calendarRepository = calendarRepository,
    extendedPropertyRepository = extendedPropertyRepository,
    eventMapper = eventMapper,
    reminderMapper = reminderMapper,
    expoCalendarEventMapper = expoCalendarEventMapper,
    extendedPropertyMapper = extendedPropertyMapper,
    instanceRepository = instanceRepository,
    attendeeMapper = attendeeMapper,
    reminderRepository = reminderRepository,
    data = expoCalendarEventMapper.toData(instanceEntity, reminders),
    eventId = instanceEntity.eventId
  )

  fun create(
    eventEntity: EventEntity,
    reminders: List<ReminderEntity> = emptyList()
  ) = ExpoCalendarEvent(
    eventRepository = eventRepository,
    attendeeRepository = attendeeRepository,
    calendarRepository = calendarRepository,
    extendedPropertyRepository = extendedPropertyRepository,
    eventMapper = eventMapper,
    reminderMapper = reminderMapper,
    expoCalendarEventMapper = expoCalendarEventMapper,
    extendedPropertyMapper = extendedPropertyMapper,
    instanceRepository = instanceRepository,
    attendeeMapper = attendeeMapper,
    reminderRepository = reminderRepository,
    data = expoCalendarEventMapper.toData(eventEntity, reminders),
    eventId = eventEntity.id
  )
}
