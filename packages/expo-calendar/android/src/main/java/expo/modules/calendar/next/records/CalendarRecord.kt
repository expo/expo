package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.Enumerable

data class CalendarInputRecord(
  @Required @Field var title: String,
  @Field val name: String?,
  @Field val source: Source?,
  @Field val color: Int?,
  @Field val isVisible: Boolean?,
  @Field val isSynced: Boolean?,
  @Field val timeZone: String?,
  @Field val isPrimary: Boolean?,
  // This field can be sent from JavaScript because it is part of the public calendar shape,
  // but it is ignored by the calendar mapper because it is computed automatically in the domain layer.
  @Field val allowsModifications: Boolean?,
  @Field val allowedAvailabilities: List<String>?,
  @Field val allowedReminders: List<AlarmMethod>?,
  @Field val allowedAttendeeTypes: List<AttendeeType>?,
  @Field var ownerAccount: String?,
  @Field val accessLevel: CalendarAccessLevel?
) : Record

enum class CalendarAccessLevel(val value: String) : Enumerable {
  CONTRIBUTOR("contributor"),
  EDITOR("editor"),
  FREEBUSY("freebusy"),
  OVERRIDE("override"),
  OWNER("owner"),
  READ("read"),
  RESPOND("respond"),
  ROOT("root"),
  NONE("none")
}

data class Source(
  @Field
  val id: String? = null,
  @Field
  val type: String? = null,
  @Field
  val name: String? = null,
  @Field
  val isLocalAccount: Boolean = false
) : Record
