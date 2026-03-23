package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.dto.reminder.ReminderInput
import expo.modules.calendar.next.domain.model.reminder.Method
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.records.AlarmMethod as RecordAlarmMethod
import expo.modules.calendar.next.records.AlarmRecord

class ReminderMapper {
  fun toDomain(record: AlarmRecord) = ReminderInput(
    method = record.method?.toDomain(),
    minutes = record.relativeOffset ?: 0
  )

  fun toRecord(entity: ReminderEntity) = AlarmRecord(
    relativeOffset = entity.minutes,
    method = entity.method?.toRecord()
  )

  private fun RecordAlarmMethod.toDomain() = when (this) {
    RecordAlarmMethod.ALARM -> Method.ALARM
    RecordAlarmMethod.ALERT -> Method.ALERT
    RecordAlarmMethod.EMAIL -> Method.EMAIL
    RecordAlarmMethod.SMS -> Method.SMS
    RecordAlarmMethod.DEFAULT -> Method.DEFAULT
  }

  private fun Method.toRecord() = when (this) {
    Method.ALARM -> RecordAlarmMethod.ALARM
    Method.ALERT -> RecordAlarmMethod.ALERT
    Method.EMAIL -> RecordAlarmMethod.EMAIL
    Method.SMS -> RecordAlarmMethod.SMS
    Method.DEFAULT -> RecordAlarmMethod.DEFAULT
  }
}
