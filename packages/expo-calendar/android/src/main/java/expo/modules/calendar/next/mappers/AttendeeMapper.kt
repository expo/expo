package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.attendee.AttendeeEntity as DomainAttendeeEntity
import expo.modules.calendar.next.domain.model.attendee.AttendeeRole as DomainAttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus as DomainAttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType as DomainAttendeeType
import expo.modules.calendar.next.domain.dto.attendee.AttendeeInput
import expo.modules.calendar.next.domain.dto.attendee.AttendeeUpdate
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.kotlin.types.ValueOrUndefined
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.AttendeeRole as RecordAttendeeRole
import expo.modules.calendar.next.records.AttendeeStatus as RecordAttendeeStatus
import expo.modules.calendar.next.records.AttendeeType as RecordAttendeeType
import expo.modules.calendar.next.records.AttendeeUpdateRecord

class AttendeeMapper {
  fun toAttendeeData(entity: DomainAttendeeEntity) = ExpoCalendarAttendeeData(
    id = entity.id.toString(),
    email = entity.email,
    name = entity.name,
    role = entity.role?.toRecord(),
    status = entity.status?.toRecord(),
    type = entity.type?.toRecord()
  )

  fun toDomain(record: AttendeeRecord) = DomainAttendeeEntity(
    id = AttendeeId(
      record.id?.toLong()
        ?: throw IllegalStateException("Attendee ID must not be null")
    ),
    email = record.email,
    name = record.name,
    role = record.role?.toDomain(),
    status = record.status?.toDomain(),
    type = record.type?.toDomain()
  )

  fun toAttendeeInput(record: AttendeeRecord, eventId: EventId) = AttendeeInput(
    eventId = eventId,
    email = record.email,
    name = record.name,
    role = record.role?.toDomain(),
    status = record.status?.toDomain(),
    type = record.type?.toDomain()
  )

  fun toAttendeeUpdate(id: AttendeeId, record: AttendeeUpdateRecord) = AttendeeUpdate(
    id = id,
    email = record.email,
    name = record.name,
    role = if (record.role.isUndefined) {
      ValueOrUndefined.Undefined()
    } else {
      // Clearing attendee enum fields maps to NONE rather than null.
      ValueOrUndefined.Value(record.role.optional?.toDomain() ?: DomainAttendeeRole.NONE)
    },
    status = if (record.status.isUndefined) {
      ValueOrUndefined.Undefined()
    } else {
      // Clearing attendee enum fields maps to NONE rather than null.
      ValueOrUndefined.Value(record.status.optional?.toDomain() ?: DomainAttendeeStatus.NONE)
    },
    type = if (record.type.isUndefined) {
      ValueOrUndefined.Undefined()
    } else {
      // Clearing attendee enum fields maps to NONE rather than null.
      ValueOrUndefined.Value(record.type.optional?.toDomain() ?: DomainAttendeeType.NONE)
    }
  )

  fun toRecord(entity: DomainAttendeeEntity) = AttendeeRecord(
    id = entity.id.toString(),
    email = entity.email,
    name = entity.name,
    role = entity.role?.toRecord(),
    status = entity.status?.toRecord(),
    type = entity.type?.toRecord()
  )

  private fun RecordAttendeeRole.toDomain() = when (this) {
    RecordAttendeeRole.ATTENDEE -> DomainAttendeeRole.ATTENDEE
    RecordAttendeeRole.ORGANIZER -> DomainAttendeeRole.ORGANIZER
    RecordAttendeeRole.PERFORMER -> DomainAttendeeRole.PERFORMER
    RecordAttendeeRole.SPEAKER -> DomainAttendeeRole.SPEAKER
    RecordAttendeeRole.NONE -> DomainAttendeeRole.NONE
  }

  private fun DomainAttendeeRole.toRecord() = when (this) {
    DomainAttendeeRole.ATTENDEE -> RecordAttendeeRole.ATTENDEE
    DomainAttendeeRole.ORGANIZER -> RecordAttendeeRole.ORGANIZER
    DomainAttendeeRole.PERFORMER -> RecordAttendeeRole.PERFORMER
    DomainAttendeeRole.SPEAKER -> RecordAttendeeRole.SPEAKER
    DomainAttendeeRole.NONE -> RecordAttendeeRole.NONE
  }

  private fun RecordAttendeeStatus.toDomain() = when (this) {
    RecordAttendeeStatus.ACCEPTED -> DomainAttendeeStatus.ACCEPTED
    RecordAttendeeStatus.DECLINED -> DomainAttendeeStatus.DECLINED
    RecordAttendeeStatus.INVITED -> DomainAttendeeStatus.INVITED
    RecordAttendeeStatus.TENTATIVE -> DomainAttendeeStatus.TENTATIVE
    RecordAttendeeStatus.NONE -> DomainAttendeeStatus.NONE
  }

  private fun DomainAttendeeStatus.toRecord() = when (this) {
    DomainAttendeeStatus.ACCEPTED -> RecordAttendeeStatus.ACCEPTED
    DomainAttendeeStatus.DECLINED -> RecordAttendeeStatus.DECLINED
    DomainAttendeeStatus.INVITED -> RecordAttendeeStatus.INVITED
    DomainAttendeeStatus.TENTATIVE -> RecordAttendeeStatus.TENTATIVE
    DomainAttendeeStatus.NONE -> RecordAttendeeStatus.NONE
  }

  private fun RecordAttendeeType.toDomain() = when (this) {
    RecordAttendeeType.RESOURCE -> DomainAttendeeType.RESOURCE
    RecordAttendeeType.OPTIONAL -> DomainAttendeeType.OPTIONAL
    RecordAttendeeType.REQUIRED -> DomainAttendeeType.REQUIRED
    RecordAttendeeType.NONE -> DomainAttendeeType.NONE
  }

  private fun DomainAttendeeType.toRecord() = when (this) {
    DomainAttendeeType.RESOURCE -> RecordAttendeeType.RESOURCE
    DomainAttendeeType.OPTIONAL -> RecordAttendeeType.OPTIONAL
    DomainAttendeeType.REQUIRED -> RecordAttendeeType.REQUIRED
    DomainAttendeeType.NONE -> RecordAttendeeType.NONE
  }
}
