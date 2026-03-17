package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.dto.reminder.ReminderInput
import expo.modules.calendar.next.domain.model.reminder.AlarmMethod
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
    RecordAlarmMethod.ALARM -> AlarmMethod.ALARM
    RecordAlarmMethod.ALERT -> AlarmMethod.ALERT
    RecordAlarmMethod.EMAIL -> AlarmMethod.EMAIL
    RecordAlarmMethod.SMS -> AlarmMethod.SMS
    RecordAlarmMethod.DEFAULT -> AlarmMethod.DEFAULT
  }

  private fun AlarmMethod.toRecord() = when (this) {
    AlarmMethod.ALARM -> RecordAlarmMethod.ALARM
    AlarmMethod.ALERT -> RecordAlarmMethod.ALERT
    AlarmMethod.EMAIL -> RecordAlarmMethod.EMAIL
    AlarmMethod.SMS -> RecordAlarmMethod.SMS
    AlarmMethod.DEFAULT -> RecordAlarmMethod.DEFAULT
  }
}
