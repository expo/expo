package expo.modules.calendar.next.domain.dto.reminder

import expo.modules.calendar.next.domain.model.reminder.AlarmMethod

class ReminderInput(
  val method: AlarmMethod? = null,
  val minutes: Int
)
