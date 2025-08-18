package expo.modules.calendar.next.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CalendarRecord (
  @Field
  var id: String? = null,
  @Field
  val title: String? = null,
  @Field
  val name: String? = null,
  @Field
  val source: Source? = null,
  @Field
  // Note: For this moment we are using ProcessedColorValue on the TypeScript side which forces here
  // the use of mapping to Int, we will change this to String after removing ProcessedColorValue
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
) : Record {
  
  fun getUpdatedRecord(other: CalendarRecord, nullableFields: List<String>? = null): CalendarRecord {
    val nullableSet = nullableFields?.toSet() ?: emptySet()

    return CalendarRecord(
      id = if ("id" in nullableSet) null else other.id ?: this.id,
      title = if ("title" in nullableSet) null else other.title ?: this.title,
      name = if ("name" in nullableSet) null else other.name ?: this.name,
      source = if ("source" in nullableSet) null else other.source ?: this.source,
      color = if ("color" in nullableSet) null else other.color ?: this.color,
      isVisible = if ("isVisible" in nullableSet) this.isVisible else other.isVisible,
      isSynced = if ("isSynced" in nullableSet) this.isSynced else other.isSynced,
      timeZone = if ("timeZone" in nullableSet) null else other.timeZone ?: this.timeZone,
      isPrimary = if ("isPrimary" in nullableSet) this.isPrimary else other.isPrimary,
      allowsModifications = if ("allowsModifications" in nullableSet) this.allowsModifications else other.allowsModifications,
      allowedAvailabilities = if ("allowedAvailabilities" in nullableSet) this.allowedAvailabilities else other.allowedAvailabilities,
      allowedReminders = if ("allowedReminders" in nullableSet) this.allowedReminders else other.allowedReminders,
      allowedAttendeeTypes = if ("allowedAttendeeTypes" in nullableSet) this.allowedAttendeeTypes else other.allowedAttendeeTypes,
      ownerAccount = if ("ownerAccount" in nullableSet) null else other.ownerAccount ?: this.ownerAccount,
      accessLevel = if ("accessLevel" in nullableSet) null else other.accessLevel ?: this.accessLevel,
    )
  }
}

enum class AlarmMethod(val value: String) {
  ALARM("alarm"),
  ALERT("alert"),
  EMAIL("email"),
  SMS("sms"),
  DEFAULT("default")
}

enum class AttendeeType(val value: String) {
  RESOURCE("resource"),
  OPTIONAL("optional"),
  REQUIRED("required"),
  NONE("none")
}

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

data class Source (
  @Field
  val id: String? = null,
  @Field
  val type: String? = null,
  @Field
  val name: String? = null,
  @Field
  val isLocalAccount: Boolean = false
) : Record
