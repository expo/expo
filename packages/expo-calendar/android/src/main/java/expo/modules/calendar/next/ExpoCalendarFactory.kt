package expo.modules.calendar.next

import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.repositories.calendar.CalendarRepository
import expo.modules.calendar.next.domain.repositories.event.EventRepository
import expo.modules.calendar.next.domain.repositories.instance.InstanceRepository
import expo.modules.calendar.next.domain.repositories.reminder.ReminderRepository
import expo.modules.calendar.next.mappers.CalendarMapper
import expo.modules.calendar.next.mappers.EventMapper
import expo.modules.calendar.next.mappers.ReminderMapper

class ExpoCalendarFactory(
  private val calendarRepository: CalendarRepository,
  private val eventRepository: EventRepository,
  private val instanceRepository: InstanceRepository,
  private val reminderRepository: ReminderRepository,
  private val eventFactory: ExpoCalendarEventFactory,
  private val eventMapper: EventMapper,
  private val reminderMapper: ReminderMapper,
  private val calendarMapper: CalendarMapper
) {
  fun create(entity: CalendarEntity): ExpoCalendar {
    return ExpoCalendar(
      calendarRepository = calendarRepository,
      eventRepository = eventRepository,
      instanceRepository = instanceRepository,
      reminderRepository = reminderRepository,
      eventFactory = eventFactory,
      eventMapper = eventMapper,
      reminderMapper = reminderMapper,
      calendarMapper = calendarMapper,
      calendarEntity = entity
    )
  }
}
