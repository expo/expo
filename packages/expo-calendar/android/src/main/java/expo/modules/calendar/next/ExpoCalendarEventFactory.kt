package expo.modules.calendar.next

import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.repositories.attendee.AttendeeRepository
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.mappers.AttendeeMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ReminderMapper

class ExpoCalendarEventFactory(
  private val eventRepository: EventRepository,
  private val instanceRepository: InstanceRepository,
  private val attendeeRepository: AttendeeRepository,
  private val eventMapper: EventMapper,
  private val attendeeMapper: AttendeeMapper,
  private val reminderMapper: ReminderMapper,
  private val reminderRepository: ReminderRepository
) {
  fun create(
    instanceEntity: InstanceEntity,
    reminders: List<ReminderEntity> = emptyList()
  ) = ExpoCalendarEvent(
    eventRepository = eventRepository,
    attendeeRepository = attendeeRepository,
    eventMapper = eventMapper,
    reminderMapper = reminderMapper,
    initialInstanceEntity = instanceEntity,
    instanceRepository = instanceRepository,
    attendeeMapper = attendeeMapper,
    reminderRepository = reminderRepository,
    reminders = reminders
  )
}
