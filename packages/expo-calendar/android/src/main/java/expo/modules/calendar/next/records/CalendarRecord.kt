package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CalendarRecord(
  @Field
  var id: String? = null,
  @Field
  val title: String? = null,
  @Field
  val name: String? = null,
  @Field
  val source: Source? = null,
  @Field
  val color: Int? = null,
  @Field
  val isVisible: Boolean = true,
  @Field
  val isSynced: Boolean = true,
  @Field
  val timeZone: String? = null,
  @Field
  val isPrimary: Boolean = false,
  @Field
  val allowsModifications: Boolean = true,
  @Field
  val allowedAvailabilities: List<String> = emptyList(),
  @Field
  val allowedReminders: List<AlarmMethod> = emptyList(),
  @Field
  val allowedAttendeeTypes: List<AttendeeType> = emptyList(),
  @Field
  var ownerAccount: String? = null,
  @Field
  val accessLevel: CalendarAccessLevel? = null,
) : Record

enum class CalendarAccessLevel(val value: String) {
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
