package expo.modules.calendar.domain.calendar.records

import expo.modules.calendar.domain.attendee.enums.AttendeeType
import expo.modules.calendar.domain.calendar.enums.CalendarAccessLevel
import expo.modules.calendar.domain.event.enums.AlarmMethod
import expo.modules.calendar.domain.event.enums.Availability
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * Calendar info that is returned to JS
 */
data class CalendarEntity(
  @Field val id: String?,
  @Field val title: String?,
  @Field val isPrimary: Boolean?,
  @Field val allowedAvailabilities: List<Availability>?,
  @Field val name: String?,
  @Field val color: String?,
  @Field val ownerAccount: String?,
  @Field val timeZone: String?,
  @Field val allowedReminders: List<AlarmMethod>?,
  @Field val allowedAttendeeTypes: List<AttendeeType>?,
  @Field val isVisible: Boolean?,
  @Field val isSynced: Boolean?,
  @Field val accessLevel: CalendarAccessLevel?,
  @Field val allowsModifications: Boolean?,
  @Field val source: CalendarSource?
) : Record
