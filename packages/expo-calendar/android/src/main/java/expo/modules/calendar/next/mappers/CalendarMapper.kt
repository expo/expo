package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.AlarmMethod as DomainAlarmMethod
import expo.modules.calendar.next.domain.AttendeeType as DomainAttendeeType
import expo.modules.calendar.next.domain.Availability
import expo.modules.calendar.next.domain.CalendarAccessLevel as DomainCalendarAccessLevel
import expo.modules.calendar.next.domain.CalendarEntity
import expo.modules.calendar.next.domain.CalendarSource
import expo.modules.calendar.next.records.AlarmMethod as RecordAlarmMethod
import expo.modules.calendar.next.records.AttendeeType as RecordAttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel as RecordCalendarAccessLevel
import expo.modules.calendar.next.ExpoCalendarData
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.Source

class CalendarMapper {
  fun toDomain(record: CalendarRecord): CalendarEntity = CalendarEntity(
    id = record.id,
    title = record.title,
    name = record.name,
    color = record.color,
    ownerAccount = record.ownerAccount,
    timeZone = record.timeZone,
    isVisible = record.isVisible,
    isSynced = record.isSynced,
    isPrimary = record.isPrimary,
    allowsModifications = record.allowsModifications,
    source = record.source?.let { CalendarSource(name = it.name, type = it.type) },
    allowedAvailabilities = record.allowedAvailabilities.map { Availability.fromString(it) },
    allowedReminders = record.allowedReminders.mapNotNull { rm ->
      DomainAlarmMethod.entries.find { it.name == rm.name }
    },
    allowedAttendeeTypes = record.allowedAttendeeTypes.mapNotNull { at ->
      DomainAttendeeType.entries.find { it.name == at.name }
    },
    accessLevel = record.accessLevel?.let { level ->
      DomainCalendarAccessLevel.entries.find { it.value == level.value }
    }
  )

  fun toExpoCalendarData(entity: CalendarEntity): ExpoCalendarData = ExpoCalendarData(
    id = entity.id,
    title = entity.title,
    name = entity.name,
    color = entity.color?.let { String.format("#%06X", 0xFFFFFF and it) },
    ownerAccount = entity.ownerAccount,
    timeZone = entity.timeZone,
    isVisible = entity.isVisible ?: true,
    isSynced = entity.isSynced ?: true,
    isPrimary = entity.isPrimary ?: false,
    allowsModifications = entity.allowsModifications ?: true,
    source = entity.source?.let { Source(id = it.name, name = it.name, type = it.type, isLocalAccount = it.isLocalAccount) },
    allowedAvailabilities = entity.allowedAvailabilities?.map { it.value } ?: emptyList(),
    allowedReminders = entity.allowedReminders?.mapNotNull { rm ->
      RecordAlarmMethod.entries.find { it.name == rm.name }
    } ?: emptyList(),
    allowedAttendeeTypes = entity.allowedAttendeeTypes?.mapNotNull { at ->
      RecordAttendeeType.entries.find { it.name == at.name }
    } ?: emptyList(),
    accessLevel = entity.accessLevel?.let { level ->
      RecordCalendarAccessLevel.entries.find { it.value == level.value }
    }
  )
}
