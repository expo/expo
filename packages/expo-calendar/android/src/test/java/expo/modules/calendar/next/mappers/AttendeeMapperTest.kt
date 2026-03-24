package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.model.attendee.AttendeeEntity
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
  fun `given AttendeeEntity, when toAttendeeData, then maps all attendee data fields`() {
    // Given
    val entity = AttendeeEntity(
      id = AttendeeId(7L),
      email = "alice@example.com",
      name = "Alice",
      role = AttendeeRole.ORGANIZER,
      status = AttendeeStatus.ACCEPTED,
      type = AttendeeType.REQUIRED
    )

    // When
    val result = mapper.toAttendeeData(entity)

    // Then
    Assert.assertEquals("7", result.id)
    Assert.assertEquals("alice@example.com", result.email)
    Assert.assertEquals("Alice", result.name)
    Assert.assertEquals(RecordAttendeeRole.ORGANIZER, result.role)
    Assert.assertEquals(RecordAttendeeStatus.ACCEPTED, result.status)
    Assert.assertEquals(RecordAttendeeType.REQUIRED, result.type)
  }

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
  fun `given AttendeeUpdateRecord with defined fields, when toAttendeeUpdate, then maps update fields`() {
    // Given
    val record = AttendeeUpdateRecord(
      email = ValueOrUndefined.Value("bob@example.com"),
      name = ValueOrUndefined.Value("Bob"),
      role = ValueOrUndefined.Value(RecordAttendeeRole.SPEAKER),
      status = ValueOrUndefined.Value(RecordAttendeeStatus.TENTATIVE),
      type = ValueOrUndefined.Value(RecordAttendeeType.OPTIONAL)
    )

    // When
    val result = mapper.toAttendeeUpdate(AttendeeId(13L), record)

    // Then
    Assert.assertEquals(AttendeeId(13L), result.id)
    Assert.assertEquals("bob@example.com", result.email.optional)
    Assert.assertEquals("Bob", result.name.optional)
    Assert.assertEquals(AttendeeRole.SPEAKER, result.role.optional)
    Assert.assertEquals(AttendeeStatus.TENTATIVE, result.status.optional)
    Assert.assertEquals(AttendeeType.OPTIONAL, result.type.optional)
  }

  @Test
  fun `given AttendeeUpdateRecord with null enum fields, when toAttendeeUpdate, then maps them to NONE`() {
    // Given
    val record = AttendeeUpdateRecord(
      email = ValueOrUndefined.Value(null),
      name = ValueOrUndefined.Value(null),
      role = ValueOrUndefined.Value(null),
      status = ValueOrUndefined.Value(null),
      type = ValueOrUndefined.Value(null)
    )

    // When
    val result = mapper.toAttendeeUpdate(AttendeeId(13L), record)

    // Then
    Assert.assertNull(result.email.optional)
    Assert.assertNull(result.name.optional)
    Assert.assertEquals(AttendeeRole.NONE, result.role.optional)
    Assert.assertEquals(AttendeeStatus.NONE, result.status.optional)
    Assert.assertEquals(AttendeeType.NONE, result.type.optional)
  }

  @Test
  fun `given AttendeeUpdateRecord with undefined fields, when toAttendeeUpdate, then preserves undefineds`() {
    // Given
    val record = AttendeeUpdateRecord()

    // When
    val result = mapper.toAttendeeUpdate(AttendeeId(13L), record)

    // Then
    Assert.assertTrue(result.email.isUndefined)
    Assert.assertTrue(result.name.isUndefined)
    Assert.assertTrue(result.role.isUndefined)
    Assert.assertTrue(result.status.isUndefined)
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
