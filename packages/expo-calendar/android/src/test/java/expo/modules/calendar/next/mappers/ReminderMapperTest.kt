package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.reminder.Method
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ReminderId
import expo.modules.calendar.next.records.AlarmMethod as RecordAlarmMethod
import expo.modules.calendar.next.records.AlarmRecord
import org.junit.Assert
import org.junit.Test

class ReminderMapperTest {
  private val mapper = ReminderMapper()

  @Test
  fun `given ReminderEntity, when toRecord, then maps Method to RecordAlarmMethod`() {
    // Given
    val entity = ReminderEntity(
      id = ReminderId(5L),
      eventId = EventId(9L),
      method = Method.SMS,
      minutes = 30
    )

    // When
    val result = mapper.toRecord(entity)

    // Then
    Assert.assertEquals(30, result.relativeOffset)
    Assert.assertEquals(RecordAlarmMethod.SMS, result.method)
  }

  @Test
  fun `given ReminderEntity with null method, when toRecord, then maps method to null`() {
    // Given
    val entity = ReminderEntity(
      id = ReminderId(5L),
      eventId = EventId(9L),
      method = null,
      minutes = 30
    )

    // When
    val result = mapper.toRecord(entity)

    // Then
    Assert.assertEquals(30, result.relativeOffset)
    Assert.assertNull(result.method)
  }

  @Test
  fun `given AlarmRecord, when toDomain, then maps method and minutes`() {
    // Given
    val record = AlarmRecord(
      relativeOffset = 15,
      method = RecordAlarmMethod.EMAIL
    )

    // When
    val result = mapper.toDomain(record)

    // Then
    Assert.assertEquals(Method.EMAIL, result.method)
    Assert.assertEquals(15, result.minutes)
  }

  @Test
  fun `given AlarmRecord with null method, when toDomain, then maps method to null`() {
    // Given
    val record = AlarmRecord(
      relativeOffset = 15,
      method = null
    )

    // When
    val result = mapper.toDomain(record)

    // Then
    Assert.assertNull(result.method)
    Assert.assertEquals(15, result.minutes)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `given AlarmRecord without relativeOffset, when toDomain, then throws IllegalArgumentException`() {
    // Given
    val record = AlarmRecord(
      relativeOffset = null,
      method = RecordAlarmMethod.EMAIL
    )

    // When / Then
    mapper.toDomain(record)
  }
}
