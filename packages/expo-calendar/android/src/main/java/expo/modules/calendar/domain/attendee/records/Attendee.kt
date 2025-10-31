package expo.modules.calendar.domain.attendee.records

import android.content.ContentValues
import android.provider.CalendarContract
import expo.modules.calendar.domain.attendee.enums.AttendeeRole
import expo.modules.calendar.domain.attendee.enums.AttendeeStatus
import expo.modules.calendar.domain.attendee.enums.AttendeeType
import expo.modules.calendar.exceptions.FieldMissingException
import expo.modules.core.utilities.ifNull
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class Attendee : Record {
  // Key "id" should be called "attendeeId",
  // but for now to keep API reverse compatibility it wasn't changed
  @Field
  val id: String?

  @Field
  val name: String?

  @Field
  val email: String?

  @Field(key = "role")
  private val jsRole: String?

  @Field(key = "status")
  private val jsStatus: String?

  @Field(key = "type")
  private val jsType: String?

  // JS values can have enum variants incompatible with Android, so we treat them as strings
  // and convert to enums here with support for default values

  val role: AttendeeRole?
    get() = jsRole?.let { AttendeeRole.fromString(it) }
  val status: AttendeeStatus?
    get() = jsStatus?.let { AttendeeStatus.fromString(it) }
  val type: AttendeeType?
    get() = jsType?.let { AttendeeType.fromString(it) }

  constructor(
    id: String?,
    name: String?,
    email: String?,
    role: AttendeeRole?,
    status: AttendeeStatus?,
    type: AttendeeType?
  ) {
    this.id = id
    this.name = name
    this.email = email
    this.jsRole = role?.value
    this.jsStatus = status?.value
    this.jsType = type?.value
  }

  /**
   * Is this object a payload for a new attendee
   */
  val isNewAttendeePayload get() = id.isNullOrEmpty()

  fun toContentValues() = ContentValues().apply {
    assertNewAttendeValid()

    name?.let { put(CalendarContract.Attendees.ATTENDEE_NAME, it) }
    email?.let { put(CalendarContract.Attendees.ATTENDEE_EMAIL, it) }
    role?.let { put(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP, it.contentProviderValue) }
    type?.let { put(CalendarContract.Attendees.ATTENDEE_TYPE, it.contentProviderValue) }
    status?.let { put(CalendarContract.Attendees.ATTENDEE_STATUS, it.contentProviderValue) }
  }

  private fun assertNewAttendeValid() {
    if (!isNewAttendeePayload) {
      return
    }

    email.ifNull { throw FieldMissingException("new attendees require `email`") }
    role.ifNull { throw FieldMissingException("new attendees require `role`") }
    type.ifNull { throw FieldMissingException("new attendees require `type`") }
    status.ifNull { throw FieldMissingException("new attendees require `status`") }
  }
}
