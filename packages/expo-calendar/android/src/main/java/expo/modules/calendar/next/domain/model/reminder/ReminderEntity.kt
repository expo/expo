package expo.modules.calendar.next.domain.model.reminder

import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ReminderId

data class ReminderEntity(
  val id: ReminderId,
  val eventId: EventId,
  val method: AlarmMethod? = null,
  val minutes: Int
)
