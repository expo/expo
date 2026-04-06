package expo.modules.calendar.next.domain.dto.reminder

import expo.modules.calendar.next.domain.model.reminder.Method

class ReminderInput(
  val method: Method? = null,
  val minutes: Int
)
