package expo.modules.calendar.next.mappers

import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.calendar.AllowedAttendeeType
import expo.modules.calendar.next.domain.model.calendar.AllowedAvailability
import expo.modules.calendar.next.domain.model.calendar.AllowedReminder
import expo.modules.calendar.next.domain.model.calendar.CalendarAccessLevel as DomainCalendarAccessLevel
import expo.modules.calendar.next.domain.model.calendar.CalendarEntity
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.AttendeeType
import expo.modules.calendar.next.records.CalendarAccessLevel
import expo.modules.calendar.next.records.CalendarRecord
import expo.modules.calendar.next.records.Source
import org.junit.Assert
import org.junit.Test

class CalendarMapperTest {
  private val mapper = CalendarMapper()

  @Test
  fun `given CalendarRecord New, when toCalendarInput, then maps source enums and defaults`() {
    // Given
    val record = CalendarRecord.New(
      title = "Work",
      name = "work_calendar",
      source = Source(
        id = "acc-1",
        name = "user@example.com",
        type = "com.google",
        isLocalAccount = true
      ),
      color = 0x00FF00,
      isVisible = null,
      isSynced = null,
      timeZone = "Europe/Warsaw",
      isPrimary = null,
      allowsModifications = null,
      allowedAvailabilities = listOf("free", "busy"),
      allowedReminders = listOf(AlarmMethod.EMAIL, AlarmMethod.ALARM),
      allowedAttendeeTypes = listOf(AttendeeType.REQUIRED, AttendeeType.OPTIONAL),
      ownerAccount = "owner@example.com",
      accessLevel = CalendarAccessLevel.OWNER
    )

    // When
    val result = mapper.toCalendarInput(record)

    // Then
    Assert.assertEquals("user@example.com", result.accountName)
    Assert.assertEquals(CalendarContract.ACCOUNT_TYPE_LOCAL, result.accountType)
    Assert.assertEquals(listOf(AllowedAttendeeType.REQUIRED, AllowedAttendeeType.OPTIONAL), result.allowedAttendeeTypes)
    Assert.assertEquals(listOf(AllowedAvailability.FREE, AllowedAvailability.BUSY), result.allowedAvailability)
    Assert.assertEquals(listOf(AllowedReminder.EMAIL, AllowedReminder.ALARM), result.allowedReminders)
    Assert.assertEquals(DomainCalendarAccessLevel.OWNER, result.calendarAccessLevel)
    Assert.assertEquals(0x00FF00, result.calendarColor)
    Assert.assertEquals("Work", result.calendarDisplayName)
    Assert.assertEquals("Europe/Warsaw", result.calendarTimeZone)
    Assert.assertEquals("work_calendar", result.name)
    Assert.assertEquals("owner@example.com", result.ownerAccount)
    Assert.assertEquals(false, result.isPrimary)
    Assert.assertEquals(true, result.syncEvents)
    Assert.assertEquals(true, result.visible)
  }

  @Test
  fun `given CalendarRecord Existing, when toDomain, then maps id and defaults primary to false`() {
    // Given
    val record = CalendarRecord.Existing(
      id = "7",
      title = "Personal",
      name = "personal_calendar",
      source = Source(
        id = "src-1",
        name = "me@example.com",
        type = "local",
        isLocalAccount = false
      ),
      color = 0x112233,
      isVisible = null,
      isSynced = null,
      timeZone = "Europe/Warsaw",
      isPrimary = null,
      allowsModifications = null,
      allowedAvailabilities = listOf("tentative"),
      allowedReminders = listOf(AlarmMethod.DEFAULT),
      allowedAttendeeTypes = listOf(AttendeeType.RESOURCE),
      ownerAccount = "owner@example.com",
      accessLevel = CalendarAccessLevel.READ
    )

    // When
    val result = mapper.toDomain(record)

    // Then
    Assert.assertEquals(CalendarId(7L), result.id)
    Assert.assertEquals("me@example.com", result.accountName)
    Assert.assertEquals("local", result.accountType)
    Assert.assertEquals(listOf(AllowedAvailability.TENTATIVE), result.allowedAvailability)
    Assert.assertEquals(listOf(AllowedReminder.DEFAULT), result.allowedReminders)
    Assert.assertEquals(listOf(AllowedAttendeeType.RESOURCE), result.allowedAttendeeTypes)
    Assert.assertEquals(DomainCalendarAccessLevel.READ, result.calendarAccessLevel)
    Assert.assertEquals(0x112233, result.calendarColor)
    Assert.assertEquals("Personal", result.calendarDisplayName)
    Assert.assertEquals("Europe/Warsaw", result.calendarTimeZone)
    Assert.assertEquals(false, result.isPrimary)
    Assert.assertEquals("personal_calendar", result.name)
    Assert.assertEquals("owner@example.com", result.ownerAccount)
    Assert.assertEquals(true, result.syncEvents)
    Assert.assertEquals(true, result.visible)
  }

  @Test
  fun `given CalendarEntity, when toExpoCalendarData, then maps source color and allowsModifications`() {
    // Given
    val entity = CalendarEntity(
      id = CalendarId(9L),
      accountName = "user@example.com",
      accountType = CalendarContract.ACCOUNT_TYPE_LOCAL,
      allowedAttendeeTypes = listOf(AllowedAttendeeType.REQUIRED),
      allowedAvailability = listOf(AllowedAvailability.FREE),
      allowedReminders = listOf(AllowedReminder.EMAIL),
      calendarAccessLevel = DomainCalendarAccessLevel.EDITOR,
      calendarColor = 0x00A0B0,
      calendarDisplayName = "Work",
      calendarTimeZone = "Europe/Warsaw",
      isPrimary = true,
      name = "work_calendar",
      ownerAccount = "owner@example.com",
      syncEvents = true,
      visible = false
    )

    // When
    val result = mapper.toExpoCalendarData(entity)

    // Then
    Assert.assertEquals(CalendarAccessLevel.EDITOR, result.accessLevel)
    Assert.assertEquals(listOf(AttendeeType.REQUIRED), result.allowedAttendeeTypes)
    Assert.assertEquals(listOf("free"), result.allowedAvailabilities)
    Assert.assertEquals(listOf(AlarmMethod.EMAIL), result.allowedReminders)
    Assert.assertEquals(true, result.allowsModifications)
    Assert.assertEquals("#00A0B0", result.color)
    Assert.assertEquals("9", result.id)
    Assert.assertEquals(true, result.isPrimary)
    Assert.assertEquals(true, result.isSynced)
    Assert.assertEquals(false, result.isVisible)
    Assert.assertEquals("work_calendar", result.name)
    Assert.assertEquals("owner@example.com", result.ownerAccount)
    Assert.assertEquals("Europe/Warsaw", result.timeZone)
    Assert.assertEquals("Work", result.title)
    Assert.assertEquals(
      Source(
        id = "user@example.com",
        name = "user@example.com",
        type = CalendarContract.ACCOUNT_TYPE_LOCAL,
        isLocalAccount = true
      ),
      result.source
    )
  }
}
