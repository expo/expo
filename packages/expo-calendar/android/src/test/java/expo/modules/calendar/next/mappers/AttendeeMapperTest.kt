package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.records.AttendeeRecord
import expo.modules.calendar.next.records.AttendeeRole as RecordAttendeeRole
import expo.modules.calendar.next.records.AttendeeStatus as RecordAttendeeStatus
import expo.modules.calendar.next.records.AttendeeType as RecordAttendeeType
import expo.modules.calendar.next.records.AttendeeUpdateRecord
import expo.modules.kotlin.types.ValueOrUndefined
import org.junit.Assert
import org.junit.Test

class AttendeeMapperTest {
  private val mapper = AttendeeMapper()

  @Test
  fun `given AttendeeRecord, when toDomain, then maps all attendee fields`() {
    // Given
    val record = AttendeeRecord(
      id = "7",
      email = "alice@example.com",
      name = "Alice",
      role = RecordAttendeeRole.ORGANIZER,
      status = RecordAttendeeStatus.ACCEPTED,
      type = RecordAttendeeType.REQUIRED
    )

    // When
    val result = mapper.toDomain(record)

    // Then
    Assert.assertEquals(AttendeeId(7L), result.id)
    Assert.assertEquals("alice@example.com", result.email)
    Assert.assertEquals("Alice", result.name)
    Assert.assertEquals(AttendeeRole.ORGANIZER, result.role)
    Assert.assertEquals(AttendeeStatus.ACCEPTED, result.status)
    Assert.assertEquals(AttendeeType.REQUIRED, result.type)
  }

  @Test
  fun `given AttendeeRecord and event id, when toAttendeeInput, then includes event id in mapped input`() {
    // Given
    val record = AttendeeRecord(
      email = "alice@example.com",
      name = "Alice",
      role = RecordAttendeeRole.ATTENDEE,
      status = RecordAttendeeStatus.TENTATIVE,
      type = RecordAttendeeType.OPTIONAL
    )

    // When
    val result = mapper.toAttendeeInput(record, EventId(11L))

    // Then
    Assert.assertEquals(EventId(11L), result.eventId)
    Assert.assertEquals("alice@example.com", result.email)
    Assert.assertEquals("Alice", result.name)
    Assert.assertEquals(AttendeeRole.ATTENDEE, result.role)
    Assert.assertEquals(AttendeeStatus.TENTATIVE, result.status)
    Assert.assertEquals(AttendeeType.OPTIONAL, result.type)
  }

  @Test
  fun `given AttendeeUpdateRecord, when toAttendeeUpdate, then preserves undefined fields and maps null enums to NONE`() {
    // Given
    val record = AttendeeUpdateRecord(
      email = ValueOrUndefined.Value("bob@example.com"),
      name = ValueOrUndefined.Undefined(),
      role = ValueOrUndefined.Value(RecordAttendeeRole.SPEAKER),
      status = ValueOrUndefined.Value(null),
      type = ValueOrUndefined.Undefined()
    )

    // When
    val result = mapper.toAttendeeUpdate(AttendeeId(13L), record)

    // Then
    Assert.assertEquals(AttendeeId(13L), result.id)
    Assert.assertEquals("bob@example.com", result.email.optional)
    Assert.assertTrue(result.name.isUndefined)
    Assert.assertEquals(AttendeeRole.SPEAKER, result.role.optional)
    Assert.assertEquals(AttendeeStatus.NONE, result.status.optional)
    Assert.assertTrue(result.type.isUndefined)
  }

  @Test(expected = IllegalStateException::class)
  fun `given AttendeeRecord without id, when toDomain, then throws IllegalStateException`() {
    // Given
    val record = AttendeeRecord(email = "alice@example.com")

    // When / Then
    mapper.toDomain(record)
  }
}
