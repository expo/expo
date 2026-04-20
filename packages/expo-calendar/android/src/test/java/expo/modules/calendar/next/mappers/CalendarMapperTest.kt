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
import expo.modules.calendar.next.records.CalendarInputRecord
import expo.modules.calendar.next.records.CalendarUpdateRecord
import expo.modules.calendar.next.records.Source
import expo.modules.kotlin.types.ValueOrUndefined
import org.junit.Assert
import org.junit.Test

class CalendarMapperTest {
  private val mapper = CalendarMapper()

  // region toCalendarInput

  @Test
  fun `given CalendarInputRecord with defined fields, when toCalendarInput, then maps input fields`() {
    // Given
    val record = CalendarInputRecord(
      title = "Work",
      name = "work_calendar",
      source = Source(
        id = "acc-1",
        name = "user@example.com",
        type = "com.google",
        isLocalAccount = true
      ),
      color = 0x00FF00,
      isVisible = false,
      isSynced = false,
      timeZone = "Europe/Warsaw",
      isPrimary = true,
      allowedAvailabilities = listOf("free", "busy"),
      allowedReminders = listOf(AlarmMethod.EMAIL, AlarmMethod.ALARM),
      allowedAttendeeTypes = listOf(AttendeeType.REQUIRED, AttendeeType.OPTIONAL),
      ownerAccount = "owner@example.com",
      accessLevel = CalendarAccessLevel.OWNER,
      allowsModifications = true
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
    Assert.assertEquals(true, result.isPrimary)
    Assert.assertEquals(false, result.syncEvents)
    Assert.assertEquals(false, result.visible)
  }

  @Test
  fun `given CalendarInputRecord with null fields, when toCalendarInput, then preserves nulls and uses boolean defaults`() {
    // Given
    val record = CalendarInputRecord(
      title = "Work",
      name = null,
      source = null,
      color = null,
      isVisible = null,
      isSynced = null,
      timeZone = null,
      isPrimary = null,
      allowedAvailabilities = null,
      allowedReminders = null,
      allowedAttendeeTypes = null,
      ownerAccount = null,
      accessLevel = null,
      allowsModifications = null
    )

    // When
    val result = mapper.toCalendarInput(record)

    // Then
    Assert.assertNull(result.accountName)
    Assert.assertNull(result.accountType)
    Assert.assertTrue(result.allowedAttendeeTypes.isEmpty())
    Assert.assertTrue(result.allowedAvailability.isEmpty())
    Assert.assertTrue(result.allowedReminders.isEmpty())
    Assert.assertNull(result.calendarAccessLevel)
    Assert.assertNull(result.calendarColor)
    Assert.assertEquals("Work", result.calendarDisplayName)
    Assert.assertNull(result.calendarTimeZone)
    Assert.assertEquals(false, result.isPrimary)
    Assert.assertNull(result.name)
    Assert.assertNull(result.ownerAccount)
    Assert.assertEquals(true, result.syncEvents)
    Assert.assertEquals(true, result.visible)
  }

  // endregion

  // region toExpoCalendarData

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

  @Test
  fun `given CalendarEntity with null fields, when toExpoCalendarData, then preserves nulls and defaults allowsModifications to false`() {
    // Given
    val entity = CalendarEntity(
      id = CalendarId(9L),
      accountName = null,
      accountType = null,
      allowedAttendeeTypes = emptyList(),
      allowedAvailability = emptyList(),
      allowedReminders = emptyList(),
      calendarAccessLevel = null,
      calendarColor = null,
      calendarDisplayName = "Work",
      calendarTimeZone = null,
      isPrimary = false,
      name = null,
      ownerAccount = null,
      syncEvents = true,
      visible = false
    )

    // When
    val result = mapper.toExpoCalendarData(entity)

    // Then
    Assert.assertNull(result.accessLevel)
    Assert.assertTrue(result.allowedAttendeeTypes.isEmpty())
    Assert.assertTrue(result.allowedAvailabilities.isEmpty())
    Assert.assertTrue(result.allowedReminders.isEmpty())
    Assert.assertEquals(false, result.allowsModifications)
    Assert.assertNull(result.color)
    Assert.assertEquals("9", result.id)
    Assert.assertEquals(false, result.isPrimary)
    Assert.assertEquals(true, result.isSynced)
    Assert.assertEquals(false, result.isVisible)
    Assert.assertNull(result.name)
    Assert.assertNull(result.ownerAccount)
    Assert.assertNull(result.source)
    Assert.assertNull(result.timeZone)
    Assert.assertEquals("Work", result.title)
  }

  // endregion

  // region toCalendarUpdate

  @Test
  fun `given CalendarUpdateRecord with defined fields, when toCalendarUpdate, then maps update fields`() {
    // Given
    val record = CalendarUpdateRecord(
      name = ValueOrUndefined.Value("work_calendar"),
      title = ValueOrUndefined.Value("Work"),
      color = ValueOrUndefined.Value(0x00A0B0),
      isVisible = ValueOrUndefined.Value(false),
      isSynced = ValueOrUndefined.Value(true),
      timeZone = ValueOrUndefined.Value("Europe/Warsaw")
    )

    // When
    val result = mapper.toCalendarUpdate(record)

    // Then
    Assert.assertEquals("work_calendar", result.name.optional)
    Assert.assertEquals("Work", result.calendarDisplayName.optional)
    Assert.assertEquals(0x00A0B0, result.calendarColor.optional)
    Assert.assertEquals(false, result.visible.optional)
    Assert.assertEquals(true, result.syncEvents.optional)
    Assert.assertEquals("Europe/Warsaw", result.calendarTimeZone.optional)
  }

  @Test
  fun `given CalendarUpdateRecord with null fields, when toCalendarUpdate, then preserves explicit nulls`() {
    // Given
    val record = CalendarUpdateRecord(
      name = ValueOrUndefined.Value(null),
      title = ValueOrUndefined.Value(null),
      color = ValueOrUndefined.Value(null),
      isVisible = ValueOrUndefined.Value(null),
      isSynced = ValueOrUndefined.Value(null),
      timeZone = ValueOrUndefined.Value(null)
    )

    // When
    val result = mapper.toCalendarUpdate(record)

    // Then
    Assert.assertNull(result.name.optional)
    Assert.assertNull(result.calendarDisplayName.optional)
    Assert.assertNull(result.calendarColor.optional)
    Assert.assertNull(result.visible.optional)
    Assert.assertNull(result.syncEvents.optional)
    Assert.assertNull(result.calendarTimeZone.optional)
  }

  @Test
  fun `given CalendarUpdateRecord with undefined fields, when toCalendarUpdate, then preserves undefineds`() {
    // Given
    val record = CalendarUpdateRecord()

    // When
    val result = mapper.toCalendarUpdate(record)

    // Then
    Assert.assertTrue(result.name.isUndefined)
    Assert.assertTrue(result.calendarDisplayName.isUndefined)
    Assert.assertTrue(result.calendarColor.isUndefined)
    Assert.assertTrue(result.visible.isUndefined)
    Assert.assertTrue(result.syncEvents.isUndefined)
    Assert.assertTrue(result.calendarTimeZone.isUndefined)
  }

  // endregion
}
