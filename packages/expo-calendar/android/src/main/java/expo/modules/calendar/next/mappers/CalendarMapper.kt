package expo.modules.calendar.next.mappers

import android.provider.CalendarContract
import expo.modules.calendar.next.ExpoCalendarData
import expo.modules.calendar.next.domain.dto.calendar.CalendarInput
import expo.modules.calendar.next.domain.dto.calendar.CalendarUpdate
import expo.modules.calendar.next.domain.model.calendar.AllowedAttendeeType as DomainAttendeeType
import expo.modules.calendar.next.domain.model.calendar.AllowedAvailability as DomainAllowedAvailability
import expo.modules.calendar.next.domain.model.calendar.AllowedReminder as DomainAllowedReminder
import expo.modules.calendar.next.domain.model.calendar.CalendarAccessLevel as DomainCalendarAccessLevel
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.CalendarInputRecord
import expo.modules.calendar.next.records.CalendarUpdateRecord
import expo.modules.calendar.next.records.Source

class CalendarMapper {
  fun toCalendarInput(record: CalendarInputRecord) = CalendarInput(
    accountName = record.source?.name,
    accountType = record.source?.let {
      if (it.isLocalAccount) {
        CalendarContract.ACCOUNT_TYPE_LOCAL
      } else {
        it.type
      }
    },
    allowedAttendeeTypes = record.allowedAttendeeTypes?.mapNotNull { allowedAttendeeType ->
      DomainAttendeeType.entries.find { it.name == allowedAttendeeType.name }
    } ?: emptyList(),
    allowedAvailability = record.allowedAvailabilities?.mapNotNull { allowedAvailability ->
      DomainAllowedAvailability.entries.find { it.name.lowercase() == allowedAvailability }
    } ?: emptyList(),
    allowedReminders = record.allowedReminders?.mapNotNull { allowedReminder ->
      DomainAllowedReminder.entries.find { it.name == allowedReminder.name }
    } ?: emptyList(),
    calendarAccessLevel = record.accessLevel?.toDomain(),
    calendarColor = record.color,
    calendarDisplayName = record.title,
    calendarTimeZone = record.timeZone,
    // `isPrimary` should only be enabled explicitly by the caller.
    isPrimary = record.isPrimary ?: false,
    name = record.name,
    ownerAccount = record.ownerAccount,
    // Visibility/sync flags should be enabled by default for new calendars so that they are
    syncEvents = record.isSynced ?: true,
    visible = record.isVisible ?: true
  )

  fun toExpoCalendarData(entity: CalendarEntity) = ExpoCalendarData(
    accessLevel = entity.calendarAccessLevel?.toRecord(),
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

  fun toCalendarUpdate(record: CalendarUpdateRecord) = CalendarUpdate(
    name = record.name,
    calendarDisplayName = record.title,
    calendarColor = record.color,
    visible = record.isVisible,
    syncEvents = record.isSynced,
    calendarTimeZone = record.timeZone
  )

  private fun CalendarAccessLevel.toDomain() = when (this) {
    CalendarAccessLevel.CONTRIBUTOR -> DomainCalendarAccessLevel.CONTRIBUTOR
    CalendarAccessLevel.EDITOR -> DomainCalendarAccessLevel.EDITOR
    CalendarAccessLevel.FREEBUSY -> DomainCalendarAccessLevel.FREEBUSY
    CalendarAccessLevel.OVERRIDE -> DomainCalendarAccessLevel.OVERRIDE
    CalendarAccessLevel.OWNER -> DomainCalendarAccessLevel.OWNER
    CalendarAccessLevel.READ -> DomainCalendarAccessLevel.READ
    CalendarAccessLevel.RESPOND -> DomainCalendarAccessLevel.RESPOND
    CalendarAccessLevel.ROOT -> DomainCalendarAccessLevel.ROOT
    CalendarAccessLevel.NONE -> DomainCalendarAccessLevel.NONE
  }

  private fun DomainCalendarAccessLevel.toRecord() = when (this) {
    DomainCalendarAccessLevel.CONTRIBUTOR -> CalendarAccessLevel.CONTRIBUTOR
    DomainCalendarAccessLevel.EDITOR -> CalendarAccessLevel.EDITOR
    DomainCalendarAccessLevel.FREEBUSY -> CalendarAccessLevel.FREEBUSY
    DomainCalendarAccessLevel.OVERRIDE -> CalendarAccessLevel.OVERRIDE
    DomainCalendarAccessLevel.OWNER -> CalendarAccessLevel.OWNER
    DomainCalendarAccessLevel.READ -> CalendarAccessLevel.READ
    DomainCalendarAccessLevel.RESPOND -> CalendarAccessLevel.RESPOND
    DomainCalendarAccessLevel.ROOT -> CalendarAccessLevel.ROOT
    DomainCalendarAccessLevel.NONE -> CalendarAccessLevel.NONE
  }
}
