package expo.modules.calendar.next.records

import android.provider.CalendarContract
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

  companion object {
    fun fromAccessLevelString(accessLevelString: String?): CalendarAccessLevel {
      return entries.find { it.value == accessLevelString } ?: NONE
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
