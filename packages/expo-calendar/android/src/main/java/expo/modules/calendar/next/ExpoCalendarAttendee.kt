package expo.modules.calendar.next

import expo.modules.calendar.next.domain.model.attendee.AttendeeEntity
import expo.modules.calendar.next.domain.repositories.attendee.AttendeeRepository
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.calendar.next.exceptions.AttendeeCouldNotBeDeletedException
import expo.modules.calendar.next.exceptions.AttendeeNotFoundException
import expo.modules.calendar.next.mappers.AttendeeMapper
import expo.modules.calendar.next.records.AttendeeUpdateRecord
import expo.modules.calendar.next.records.AttendeeRole as RecordAttendeeRole
import expo.modules.calendar.next.records.AttendeeStatus as RecordAttendeeStatus
import expo.modules.calendar.next.records.AttendeeType as RecordAttendeeType
import expo.modules.kotlin.sharedobjects.SharedObject

class ExpoCalendarAttendee(
  entity: AttendeeEntity,
  private val mapper: AttendeeMapper,
  private val repository: AttendeeRepository
) : SharedObject() {
  val id: String? get() = data?.id
  val name: String? get() = data?.name
  val email: String? get() = data?.email
  val role: RecordAttendeeRole? get() = data?.role
  val status: RecordAttendeeStatus? get() = data?.status
  val type: RecordAttendeeType? get() = data?.type

  // Grouped data object to avoid manual reassignment of each field on update, reload or clear
  private val entityId: AttendeeId = entity.id
  private var data: ExpoCalendarAttendeeData? = mapper.toAttendeeData(entity)

  suspend fun update(attendeeUpdateRecord: AttendeeUpdateRecord) {
    val attendeeUpdate = mapper.toAttendeeUpdate(entityId, attendeeUpdateRecord)
    repository.update(attendeeUpdate)
    reloadProperties()
  }

  suspend fun delete() {
    if (!repository.delete(entityId)) {
      throw AttendeeCouldNotBeDeletedException("An error occurred while deleting attendee")
    }
    data = null
  }

  private suspend fun reloadProperties() {
    val attendeeEntity = repository.findById(entityId)
      ?: throw AttendeeNotFoundException("Attendee not found after reload")
    data = mapper.toAttendeeData(attendeeEntity)
  }
}
