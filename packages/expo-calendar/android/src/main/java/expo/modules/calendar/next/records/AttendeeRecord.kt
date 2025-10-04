package expo.modules.calendar.next.records

import expo.modules.calendar.attendeeRelationshipStringMatchingConstant
import expo.modules.calendar.attendeeStatusStringMatchingConstant
import expo.modules.calendar.attendeeTypeStringMatchingConstant

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

data class AttendeeRecord(
  @Field
  var id: String? = null,
  @Field
  val name: String? = null,
  @Field
  val role: AttendeeRole? = null,
  @Field
  val status: AttendeeStatus? = null,
  @Field
  val type: AttendeeType? = null,
  @Field
  val email: String? = null,
) : Record

enum class AttendeeRole(val value: String) : Enumerable {
  ATTENDEE("attendee"),
  ORGANIZER("organizer"),
  PERFORMER("performer"),
  SPEAKER("speaker"),
  NONE("none");

  companion object {
    fun fromAndroidValue(value: Int): AttendeeRole? = entries.find {
      it.value == attendeeRelationshipStringMatchingConstant(value)
    }
  }
}

enum class AttendeeStatus(val value: String) : Enumerable {
  ACCEPTED("accepted"),
  DECLINED("declined"),
  INVITED("invited"),
  TENTATIVE("tentative"),
  NONE("none");

  companion object {
    fun fromAndroidValue(value: Int): AttendeeStatus? = entries.find {
      it.value == attendeeStatusStringMatchingConstant(value)
    }
  }
}

enum class AttendeeType(val value: String) : Enumerable {
  RESOURCE("resource"),
  OPTIONAL("optional"),
  REQUIRED("required"),
  NONE("none");

  companion object {
    fun fromAndroidValue(value: Int): AttendeeType? = entries.find {
      it.value == attendeeTypeStringMatchingConstant(value)
    }

    fun fromAttendeeTypesString(attendeeTypesString: String?): List<AttendeeType> {
      return attendeeTypesString
        ?.split(",")
        ?.filter { it.isNotBlank() }
        ?.map { attendeeTypeString ->
          entries.find { it.value == attendeeTypeString } ?: NONE
        } ?: emptyList()
    }
  }
}
