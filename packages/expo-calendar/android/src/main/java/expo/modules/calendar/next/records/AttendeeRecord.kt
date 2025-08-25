package expo.modules.calendar.next.records

import android.content.ContentResolver
import android.database.Cursor
import android.provider.CalendarContract
import expo.modules.calendar.CalendarUtils
import expo.modules.calendar.attendeeRelationshipConstantMatchingString
import expo.modules.calendar.attendeeRelationshipStringMatchingConstant
import expo.modules.calendar.attendeeStatusConstantMatchingString
import expo.modules.calendar.attendeeStatusStringMatchingConstant
import expo.modules.calendar.attendeeTypeConstantMatchingString
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
) : Record {
  companion object {
    @JvmStatic
    fun fromCursor(cursor: Cursor, contentResolver: ContentResolver): AttendeeRecord {
      return AttendeeRecord(
        id = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Attendees._ID),
        name = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_NAME),
        role = AttendeeRole.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_RELATIONSHIP)),
        status = AttendeeStatus.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_STATUS)),
        type = AttendeeType.fromAndroidValue(CalendarUtils.optIntFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_TYPE)),
        email = CalendarUtils.optStringFromCursor(cursor, CalendarContract.Attendees.ATTENDEE_EMAIL),
      )
    }
  }
}

enum class AttendeeRole(val value: String) : Enumerable {
  ATTENDEE("attendee"),
  ORGANIZER("organizer"),
  PERFORMER("performer"),
  SPEAKER("speaker"),
  NONE("none"),

  // iOS only, not supported on Android:
  UNKNOWN("unknown"),
  REQUIRED("required"),
  OPTIONAL("optional"),
  CHAIR("chair"),
  NON_PARTICIPANT("nonParticipant");

  fun toAndroidValue(role: AttendeeRole?): Int? {
    return role?.value?.let { attendeeRelationshipConstantMatchingString(it) }
  }

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
  NONE("none"),

  // iOS only, not supported on Android:
  UNKNOWN("unknown"),
  PENDING("pending"),
  DELEGATED("delegated"),
  COMPLETED("completed"),
  IN_PROCESS("inProcess");

  fun toAndroidValue(status: AttendeeStatus?): Int? {
    return status?.value?.let { attendeeStatusConstantMatchingString(it) }
  }

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
  NONE("none"),

  // iOS only, not supported on Android:
  UNKNOWN("unknown"),
  PERSON("person"),
  ROOM("room"),
  GROUP("group");

  fun toAndroidValue(type: AttendeeType?): Int? {
    return type?.value?.let { attendeeTypeConstantMatchingString(it) }
  }

  companion object {
    fun fromAndroidValue(value: Int): AttendeeType? = entries.find {
      it.value == attendeeTypeStringMatchingConstant(value)
    }
  }
}
