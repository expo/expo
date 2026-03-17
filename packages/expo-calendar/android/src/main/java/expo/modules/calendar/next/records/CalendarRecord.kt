package expo.modules.calendar.next.records

import android.provider.CalendarContract
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required
import expo.modules.kotlin.types.Enumerable

sealed interface CalendarRecord : Record {
  data class New(
    @Required @Field var title: String,
    @Field val name: String?,
    @Field val source: Source?,
    @Field val color: Int?,
    @Field val isVisible: Boolean?,
    @Field val isSynced: Boolean?,
    @Field val timeZone: String?,
    @Field val isPrimary: Boolean?,
    @Field val allowsModifications: Boolean?,
    @Field val allowedAvailabilities: List<String>?,
    @Field val allowedReminders: List<AlarmMethod>?,
    @Field val allowedAttendeeTypes: List<AttendeeType>?,
    @Field var ownerAccount: String?,
    @Field val accessLevel: CalendarAccessLevel?
  ) : CalendarRecord

  data class Existing(
    @Required @Field var id: String,
    @Required @Field val title: String,
    @Field val name: String?,
    @Field val source: Source?,
    @Field val color: Int?,
    @Field val isVisible: Boolean?,
    @Field val isSynced: Boolean?,
    @Field val timeZone: String?,
    @Field val isPrimary: Boolean?,
    @Field val allowsModifications: Boolean?,
    @Field val allowedAvailabilities: List<String>?,
    @Field val allowedReminders: List<AlarmMethod>?,
    @Field val allowedAttendeeTypes: List<AttendeeType>?,
    @Field var ownerAccount: String?,
    @Field val accessLevel: CalendarAccessLevel?
  ) : CalendarRecord
}

enum class CalendarAccessLevel(val value: String) : Enumerable {
  CONTRIBUTOR("contributor"),
  EDITOR("editor"),
  FREEBUSY("freebusy"),
  OVERRIDE("override"),
  OWNER("owner"),
  READ("read"),
  RESPOND("respond"),
  ROOT("root"),
  NONE("none");

  fun toAndroidValue(): Int {
    return when (this) {
      OWNER -> CalendarContract.Calendars.CAL_ACCESS_OWNER
      EDITOR -> CalendarContract.Calendars.CAL_ACCESS_EDITOR
      CONTRIBUTOR -> CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR
      READ -> CalendarContract.Calendars.CAL_ACCESS_READ
      RESPOND -> CalendarContract.Calendars.CAL_ACCESS_RESPOND
      FREEBUSY -> CalendarContract.Calendars.CAL_ACCESS_FREEBUSY
      OVERRIDE -> CalendarContract.Calendars.CAL_ACCESS_OVERRIDE
      ROOT -> CalendarContract.Calendars.CAL_ACCESS_ROOT
      NONE -> CalendarContract.Calendars.CAL_ACCESS_NONE
    }
  }
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
