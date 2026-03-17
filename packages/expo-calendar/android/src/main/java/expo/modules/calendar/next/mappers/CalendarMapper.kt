package expo.modules.calendar.next.mappers

import android.provider.CalendarContract
import expo.modules.calendar.next.ExpoCalendarData
import expo.modules.calendar.next.domain.dto.calendar.CalendarInput
import expo.modules.calendar.next.domain.model.calendar.AllowedAttendeeType as DomainAttendeeType
import expo.modules.calendar.next.domain.model.calendar.AllowedAvailability as DomainAllowedAvailability
import expo.modules.calendar.next.domain.model.calendar.AllowedReminder as DomainAllowedReminder
import expo.modules.calendar.next.domain.model.calendar.CalendarAccessLevel as DomainCalendarAccessLevel
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.Source

class CalendarMapper {
  fun toCalendarInput(record: CalendarRecord.New) = CalendarInput(
    accountName = record.source?.name,
    accountType = record.source?.let { if (it.isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else it.type },
    allowedAttendeeTypes = record.allowedAttendeeTypes?.mapNotNull { at ->
      DomainAttendeeType.entries.find { it.name == at.name }
    } ?: emptyList(),
    allowedAvailability = record.allowedAvailabilities?.mapNotNull { str ->
      DomainAllowedAvailability.entries.find { it.name.lowercase() == str }
    } ?: emptyList(),
    allowedReminders = record.allowedReminders?.mapNotNull { rm ->
      DomainAllowedReminder.entries.find { it.name == rm.name }
    } ?: emptyList(),
    calendarAccessLevel = record.accessLevel?.let { level ->
      DomainCalendarAccessLevel.entries.find { it.value == level.toAndroidValue() }
    },
    calendarColor = record.color,
    calendarDisplayName = record.title,
    calendarTimeZone = record.timeZone,
    isPrimary = record.isPrimary ?: false,
    name = record.name,
    ownerAccount = record.ownerAccount,
    syncEvents = record.isSynced ?: true,
    visible = record.isVisible ?: true
  )

  fun toDomain(record: CalendarRecord.Existing) = CalendarEntity(
    id = CalendarId(record.id.toLong()),
    accountName = record.source?.name,
    accountType = record.source?.let { if (it.isLocalAccount) CalendarContract.ACCOUNT_TYPE_LOCAL else it.type },
    allowedAttendeeTypes = record.allowedAttendeeTypes?.mapNotNull { at ->
      DomainAttendeeType.entries.find { it.name == at.name }
    } ?: emptyList(),
    allowedAvailability = record.allowedAvailabilities?.mapNotNull { str ->
      DomainAllowedAvailability.entries.find { it.name.lowercase() == str }
    } ?: emptyList(),
    allowedReminders = record.allowedReminders?.mapNotNull { rm ->
      DomainAllowedReminder.entries.find { it.name == rm.name }
    } ?: emptyList(),
    calendarAccessLevel = record.accessLevel?.let { level ->
      DomainCalendarAccessLevel.entries.find { it.value == level.toAndroidValue() }
    },
    calendarColor = record.color,
    calendarDisplayName = record.title,
    calendarTimeZone = record.timeZone,
    isPrimary = record.isPrimary ?: true,
    name = record.name,
    ownerAccount = record.ownerAccount,
    syncEvents = record.isSynced ?: true,
    visible = record.isVisible ?: true
  )

  fun toExpoCalendarData(entity: CalendarEntity) = ExpoCalendarData(
    accessLevel = entity.calendarAccessLevel?.let { level ->
      CalendarAccessLevel.entries.find { it.toAndroidValue() == level.value }
    },
    allowedAttendeeTypes = entity.allowedAttendeeTypes.mapNotNull { at ->
      AttendeeType.entries.find { it.name == at.name }
    },
    allowedAvailabilities = entity.allowedAvailability.map { it.name.lowercase() },
    allowedReminders = entity.allowedReminders.mapNotNull { rm ->
      AlarmMethod.entries.find { it.name == rm.name }
    },
    allowsModifications = entity.calendarAccessLevel?.let {
      it == DomainCalendarAccessLevel.ROOT || it == DomainCalendarAccessLevel.OWNER ||
        it == DomainCalendarAccessLevel.EDITOR || it == DomainCalendarAccessLevel.CONTRIBUTOR
    } ?: false,
    color = entity.calendarColor?.let { String.format("#%06X", 0xFFFFFF and it) },
    id = entity.id.value.toString(),
    isPrimary = entity.isPrimary,
    isSynced = entity.syncEvents,
    isVisible = entity.visible,
    name = entity.name,
    ownerAccount = entity.ownerAccount,
    source = entity.accountName?.let { accountName ->
      Source(
        id = accountName,
        name = accountName,
        type = entity.accountType,
        isLocalAccount = entity.accountType == CalendarContract.ACCOUNT_TYPE_LOCAL
      )
    },
    timeZone = entity.calendarTimeZone,
    title = entity.calendarDisplayName
  )
}

