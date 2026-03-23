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
  fun `given AlarmRecord with null relativeOffset, when toDomain, then maps method and defaults minutes to 0`() {
    // Given
    val record = AlarmRecord(
      relativeOffset = null,
      method = RecordAlarmMethod.EMAIL
    )

    // When
    val result = mapper.toDomain(record)

    // Then
    Assert.assertEquals(Method.EMAIL, result.method)
    Assert.assertEquals(0, result.minutes)
  }

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
}
