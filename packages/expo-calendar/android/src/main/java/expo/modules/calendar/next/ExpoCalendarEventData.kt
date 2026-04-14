package expo.modules.calendar.next

import expo.modules.calendar.next.records.AlarmRecord
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventStatus
import expo.modules.calendar.next.records.RecurrenceRuleRecord

data class ExpoCalendarEventData(
  val id: String,
  val alarms: List<AlarmRecord>,
  val calendarId: String?,
  val title: String?,
  val notes: String?,
  val startDate: String,
  val endDate: String,
  val allDay: Boolean?,
  val location: String?,
  val timeZone: String?,
  val endTimeZone: String?,
  val availability: EventAvailability?,
  val organizerEmail: String?,
  val accessLevel: EventAccessLevel?,
  val guestsCanModify: Boolean?,
  val guestsCanInviteOthers: Boolean?,
  val guestsCanSeeGuests: Boolean?,
  val originalId: String?,
  val instanceId: Long?,
  val recurrenceRule: RecurrenceRuleRecord?,
  val status: EventStatus?
)
