package expo.modules.calendar.next.records

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
  val email: String? = null
) : Record

enum class AttendeeRole(val value: String) : Enumerable {
  ATTENDEE("attendee"),
  ORGANIZER("organizer"),
  PERFORMER("performer"),
  SPEAKER("speaker"),
  NONE("none");

  companion object {
    fun fromAndroidValue(value: Int): AttendeeRole? = entries.find {
      it.value == expo.modules.calendar.domain.attendee.enums.AttendeeRole.fromContentProviderValue(value).value
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
      it.value == expo.modules.calendar.domain.attendee.enums.AttendeeStatus.fromContentProviderValue(value).value
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
      it.value == expo.modules.calendar.domain.attendee.enums.AttendeeType.fromContentProviderValue(value).value
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
