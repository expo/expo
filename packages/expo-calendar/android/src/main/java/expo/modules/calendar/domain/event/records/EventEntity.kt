package expo.modules.calendar.domain.event.records

import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.calendar.domain.event.enums.EventAccessLevel
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class EventEntity(
  @Field val id: String,
  @Field val calendarId: String?,
  @Field val title: String?,
  @Field val notes: String?,
  @Field val startDate: String,
  @Field val endDate: String,
  @Field val alarms: List<Alarm>?,
  @Field val availability: Availability?,
  @Field val allDay: Boolean,
  @Field val location: String?,
  @Field val organizerEmail: String?,
  @Field val guestsCanModify: Boolean,
  @Field val guestsCanInviteOthers: Boolean,
  @Field val guestsCanSeeGuests: Boolean,
  @Field val timeZone: String?,
  @Field val endTimeZone: String?,
  @Field val accessLevel: EventAccessLevel?,
  @Field val recurrenceRule: RecurrenceRuleEntity?,
  @Field val originalId: String?,
  @Field val instanceId: String?
) : Record
