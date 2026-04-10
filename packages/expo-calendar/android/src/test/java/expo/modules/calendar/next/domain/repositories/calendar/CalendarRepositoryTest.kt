package expo.modules.calendar.next.domain.repositories.calendar

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.calendar.CalendarInput
import expo.modules.calendar.next.domain.dto.calendar.CalendarUpdate
import expo.modules.calendar.next.domain.model.calendar.AllowedAttendeeType
import expo.modules.calendar.next.domain.model.calendar.AllowedAvailability
import expo.modules.calendar.next.domain.model.calendar.AllowedReminder
import expo.modules.calendar.next.domain.model.calendar.CalendarAccessLevel
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.exceptions.CouldNotExecuteQueryException
import expo.modules.calendar.next.exceptions.PermissionException
import expo.modules.kotlin.types.ValueOrUndefined
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class CalendarRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = CalendarRepository(contentResolver)

  // region findAll

  @Test
  fun `given cursor has no rows, when findAll, then returns empty list`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findAll()

    // Then
    Assert.assertEquals(emptyList<Any>(), result)
  }

  @Test
  fun `given cursor with data, when findAll, then maps cursor row to CalendarEntity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Calendars._ID to 10L,
        CalendarContract.Calendars.CALENDAR_DISPLAY_NAME to "Work",
        CalendarContract.Calendars.ACCOUNT_NAME to "user@example.com",
        CalendarContract.Calendars.ACCOUNT_TYPE to "com.google",
        CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES to "${AllowedAttendeeType.REQUIRED.value}",
        CalendarContract.Calendars.ALLOWED_AVAILABILITY to "${AllowedAvailability.FREE.value},${AllowedAvailability.BUSY.value}",
        CalendarContract.Calendars.ALLOWED_REMINDERS to "${AllowedReminder.EMAIL.value}",
        CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL to CalendarContract.Calendars.CAL_ACCESS_OWNER,
        CalendarContract.Calendars.CALENDAR_COLOR to 0xFF0000,
        CalendarContract.Calendars.CALENDAR_TIME_ZONE to "Europe/Warsaw",
        CalendarContract.Calendars.IS_PRIMARY to 1,
        CalendarContract.Calendars.NAME to "work_calendar",
        CalendarContract.Calendars.OWNER_ACCOUNT to "owner@example.com",
        CalendarContract.Calendars.SYNC_EVENTS to 1,
        CalendarContract.Calendars.VISIBLE to 1
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll()

    // Then
    val entity = result.first()
    Assert.assertEquals(CalendarId(10L), entity.id)
    Assert.assertEquals("Work", entity.calendarDisplayName)
    Assert.assertEquals("user@example.com", entity.accountName)
    Assert.assertEquals("com.google", entity.accountType)
    Assert.assertEquals(0xFF0000, entity.calendarColor)
    Assert.assertEquals(CalendarAccessLevel.OWNER, entity.calendarAccessLevel)
    Assert.assertEquals("Europe/Warsaw", entity.calendarTimeZone)
    Assert.assertEquals(true, entity.isPrimary)
    Assert.assertEquals("work_calendar", entity.name)
    Assert.assertEquals("owner@example.com", entity.ownerAccount)
    Assert.assertEquals(true, entity.syncEvents)
    Assert.assertEquals(true, entity.visible)
    Assert.assertEquals(listOf(AllowedAttendeeType.REQUIRED), entity.allowedAttendeeTypes)
    Assert.assertEquals(listOf(AllowedAvailability.FREE, AllowedAvailability.BUSY), entity.allowedAvailability)
    Assert.assertEquals(listOf(AllowedReminder.EMAIL), entity.allowedReminders)
  }

  @Test
  fun `given cursor with unknown enum values, when findAll, then filters unknown enum values from allowed lists`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Calendars._ID to 1L,
        CalendarContract.Calendars.ACCOUNT_NAME to null,
        CalendarContract.Calendars.ACCOUNT_TYPE to null,
        CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES to "0,999,1",
        CalendarContract.Calendars.ALLOWED_AVAILABILITY to "0,999,1",
        CalendarContract.Calendars.ALLOWED_REMINDERS to "0,999,1",
        CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL to CalendarContract.Calendars.CAL_ACCESS_NONE,
        CalendarContract.Calendars.CALENDAR_COLOR to 0xFF000000.toInt(),
        CalendarContract.Calendars.CALENDAR_DISPLAY_NAME to "My Calendar",
        CalendarContract.Calendars.CALENDAR_TIME_ZONE to null,
        CalendarContract.Calendars.IS_PRIMARY to 0,
        CalendarContract.Calendars.NAME to null,
        CalendarContract.Calendars.OWNER_ACCOUNT to null,
        CalendarContract.Calendars.SYNC_EVENTS to 1,
        CalendarContract.Calendars.VISIBLE to 1
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll()

    // Then
    val entity = result.first()
    Assert.assertEquals(listOf(AllowedAttendeeType.NONE, AllowedAttendeeType.REQUIRED), entity.allowedAttendeeTypes)
    Assert.assertEquals(listOf(AllowedAvailability.BUSY, AllowedAvailability.FREE), entity.allowedAvailability)
    Assert.assertEquals(listOf(AllowedReminder.DEFAULT, AllowedReminder.ALERT), entity.allowedReminders)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findAll, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findAll()
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findAll, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findAll()
  }

  // endregion

  // region findById

  @Test
  fun `given cursor has a row, when findById, then returns entity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Calendars._ID to 5L,
        CalendarContract.Calendars.CALENDAR_DISPLAY_NAME to "Personal",
        CalendarContract.Calendars.ACCOUNT_NAME to "me@example.com",
        CalendarContract.Calendars.ACCOUNT_TYPE to "local",
        CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES to "${AllowedAttendeeType.OPTIONAL.value}",
        CalendarContract.Calendars.ALLOWED_AVAILABILITY to "${AllowedAvailability.TENTATIVE.value}",
        CalendarContract.Calendars.ALLOWED_REMINDERS to "${AllowedReminder.ALERT.value}",
        CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL to CalendarContract.Calendars.CAL_ACCESS_READ,
        CalendarContract.Calendars.CALENDAR_COLOR to 0x00FF00,
        CalendarContract.Calendars.CALENDAR_TIME_ZONE to "Europe/Warsaw",
        CalendarContract.Calendars.IS_PRIMARY to 1,
        CalendarContract.Calendars.NAME to "personal_calendar",
        CalendarContract.Calendars.OWNER_ACCOUNT to "owner@example.com",
        CalendarContract.Calendars.SYNC_EVENTS to 0,
        CalendarContract.Calendars.VISIBLE to 1
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(CalendarId(5L))

    // Then
    Assert.assertEquals(CalendarId(5L).value, result?.id?.value)
    Assert.assertEquals("Personal", result?.calendarDisplayName)
    Assert.assertEquals("me@example.com", result?.accountName)
    Assert.assertEquals("local", result?.accountType)
    Assert.assertEquals(listOf(AllowedAttendeeType.OPTIONAL), result?.allowedAttendeeTypes)
    Assert.assertEquals(listOf(AllowedAvailability.TENTATIVE), result?.allowedAvailability)
    Assert.assertEquals(listOf(AllowedReminder.ALERT), result?.allowedReminders)
    Assert.assertEquals(CalendarAccessLevel.READ, result?.calendarAccessLevel)
    Assert.assertEquals(0x00FF00, result?.calendarColor)
    Assert.assertEquals("Europe/Warsaw", result?.calendarTimeZone)
    Assert.assertEquals("personal_calendar", result?.name)
    Assert.assertEquals("owner@example.com", result?.ownerAccount)
    Assert.assertEquals(false, result?.syncEvents)
    Assert.assertEquals(true, result?.visible)
    Assert.assertEquals(true, result?.isPrimary)
  }

  @Test
  fun `given cursor has no rows, when findById, then returns null`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findById(CalendarId(5L))

    // Then
    Assert.assertNull(result)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findById, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findById(CalendarId(5L))
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findById, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findById(CalendarId(5L))
  }

  // endregion

  // region insert

  @Test
  fun `given inserted URI, when insert, then returns CalendarId parsed from URI`() = runTest {
    // Given
    val uri = mockk<Uri>()
    every { uri.lastPathSegment } returns "42"
    every { contentResolver.insert(any(), any()) } returns uri

    val input = CalendarInput(calendarDisplayName = "New", accountName = "acc", accountType = "type")

    // When
    val result = repository.insert(input)

    // Then
    Assert.assertEquals(CalendarId(42L), result)
  }

  @Test
  fun `given CalendarInput, when insert, then uses sync adapter URI and inserts correct values`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { insertedUri.lastPathSegment } returns "42"
    every { contentResolver.insert(capture(uriSlot), capture(valuesSlot)) } returns insertedUri

    val input = CalendarInput(
      name = "work_calendar",
      calendarDisplayName = "Work",
      visible = true,
      syncEvents = false,
      accountName = "user@example.com",
      accountType = "com.google",
      calendarColor = 0xFF0000,
      calendarAccessLevel = CalendarAccessLevel.OWNER,
      ownerAccount = "owner@example.com",
      calendarTimeZone = "Europe/Warsaw",
      allowedReminders = listOf(AllowedReminder.EMAIL),
      allowedAvailability = listOf(AllowedAvailability.FREE, AllowedAvailability.BUSY),
      allowedAttendeeTypes = listOf(AllowedAttendeeType.REQUIRED)
    )

    // When
    repository.insert(input)

    // Then
    Assert.assertEquals("true", uriSlot.captured.getQueryParameter(CalendarContract.CALLER_IS_SYNCADAPTER))
    Assert.assertEquals("user@example.com", uriSlot.captured.getQueryParameter(CalendarContract.Calendars.ACCOUNT_NAME))
    Assert.assertEquals("com.google", uriSlot.captured.getQueryParameter(CalendarContract.Calendars.ACCOUNT_TYPE))

    Assert.assertEquals("work_calendar", valuesSlot.captured.getAsString(CalendarContract.Calendars.NAME))
    Assert.assertEquals("Work", valuesSlot.captured.getAsString(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
    Assert.assertEquals(true, valuesSlot.captured.getAsBoolean(CalendarContract.Calendars.VISIBLE))
    Assert.assertEquals(false, valuesSlot.captured.getAsBoolean(CalendarContract.Calendars.SYNC_EVENTS))
    Assert.assertEquals("user@example.com", valuesSlot.captured.getAsString(CalendarContract.Calendars.ACCOUNT_NAME))
    Assert.assertEquals("com.google", valuesSlot.captured.getAsString(CalendarContract.Calendars.ACCOUNT_TYPE))
    Assert.assertEquals(0xFF0000, valuesSlot.captured.getAsInteger(CalendarContract.Calendars.CALENDAR_COLOR).toInt())
    Assert.assertEquals(CalendarContract.Calendars.CAL_ACCESS_OWNER, valuesSlot.captured.getAsInteger(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL).toInt())
    Assert.assertEquals("owner@example.com", valuesSlot.captured.getAsString(CalendarContract.Calendars.OWNER_ACCOUNT))
    Assert.assertEquals("Europe/Warsaw", valuesSlot.captured.getAsString(CalendarContract.Calendars.CALENDAR_TIME_ZONE))
    Assert.assertEquals("${AllowedReminder.EMAIL.value}", valuesSlot.captured.getAsString(CalendarContract.Calendars.ALLOWED_REMINDERS))
    Assert.assertEquals(
      "${AllowedAvailability.FREE.value},${AllowedAvailability.BUSY.value}",
      valuesSlot.captured.getAsString(CalendarContract.Calendars.ALLOWED_AVAILABILITY)
    )
    Assert.assertEquals(
      "${AllowedAttendeeType.REQUIRED.value}",
      valuesSlot.captured.getAsString(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES)
    )
  }

  @Test
  fun `given minimal CalendarInput, when insert, then writes empty allowed lists and nullable fields`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { insertedUri.lastPathSegment } returns "42"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns insertedUri

    val input = CalendarInput(calendarDisplayName = "New")

    // When
    repository.insert(input)

    // Then
    Assert.assertEquals("New", valuesSlot.captured.getAsString(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.ALLOWED_REMINDERS))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.ALLOWED_AVAILABILITY))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.NAME))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.ACCOUNT_NAME))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.ACCOUNT_TYPE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.CALENDAR_COLOR))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.OWNER_ACCOUNT))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.CALENDAR_TIME_ZONE))
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when insert, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    val input = CalendarInput(calendarDisplayName = "New", accountName = "acc", accountType = "type")

    // When / Then
    repository.insert(input)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `given inserted URI without last path segment, when insert, then throws IllegalArgumentException`() = runTest {
    // Given
    val uri = mockk<Uri>()
    every { uri.lastPathSegment } returns null
    every { contentResolver.insert(any(), any()) } returns uri

    // When / Then
    repository.insert(CalendarInput(calendarDisplayName = "New"))
  }

  @Test(expected = IllegalStateException::class)
  fun `given inserted URI with non numeric last path segment, when insert, then throws IllegalStateException`() = runTest {
    // Given
    val uri = mockk<Uri>()
    every { uri.lastPathSegment } returns "abc"
    every { contentResolver.insert(any(), any()) } returns uri

    // When / Then
    repository.insert(CalendarInput(calendarDisplayName = "New"))
  }

  // endregion

  // region update

  @Test
  fun `given CalendarUpdate with defined fields, when update, then updates only those fields`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = CalendarUpdate(
      name = ValueOrUndefined.Value("renamed_calendar"),
      calendarDisplayName = ValueOrUndefined.Value("Renamed"),
      calendarColor = ValueOrUndefined.Value(0x00FF00),
      visible = ValueOrUndefined.Value(false),
      syncEvents = ValueOrUndefined.Value(true),
      calendarTimeZone = ValueOrUndefined.Value("America/New_York")
    )

    // When
    repository.update(CalendarId(1L), update)

    // Then
    Assert.assertEquals("renamed_calendar", valuesSlot.captured.getAsString(CalendarContract.Calendars.NAME))
    Assert.assertEquals("Renamed", valuesSlot.captured.getAsString(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
    Assert.assertEquals(0x00FF00, valuesSlot.captured.getAsInteger(CalendarContract.Calendars.CALENDAR_COLOR).toInt())
    Assert.assertEquals(false, valuesSlot.captured.getAsBoolean(CalendarContract.Calendars.VISIBLE))
    Assert.assertEquals(true, valuesSlot.captured.getAsBoolean(CalendarContract.Calendars.SYNC_EVENTS))
    Assert.assertEquals("America/New_York", valuesSlot.captured.getAsString(CalendarContract.Calendars.CALENDAR_TIME_ZONE))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Calendars.ACCOUNT_NAME))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Calendars.ACCOUNT_TYPE))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Calendars.ALLOWED_REMINDERS))
  }

  @Test
  fun `given CalendarUpdate with null values, when update, then clears supported nullable fields`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = CalendarUpdate(
      name = ValueOrUndefined.Value<String?>(null),
      calendarDisplayName = ValueOrUndefined.Value(null),
      calendarColor = ValueOrUndefined.Value(null),
      visible = ValueOrUndefined.Value(null),
      syncEvents = ValueOrUndefined.Value(null),
      calendarTimeZone = ValueOrUndefined.Value(null)
    )

    // When
    repository.update(CalendarId(1L), update)

    // Then
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.NAME))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.NAME))
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.CALENDAR_COLOR))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.CALENDAR_COLOR))
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.VISIBLE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.VISIBLE))
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.SYNC_EVENTS))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.SYNC_EVENTS))
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.CALENDAR_TIME_ZONE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Calendars.CALENDAR_TIME_ZONE))
  }

  @Test
  fun `given updated rows, when update, then returns true`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } returns 1

    // When
    val result = repository.update(CalendarId(1L), CalendarUpdate())

    // Then
    Assert.assertTrue(result)
  }

  @Test
  fun `given ContentResolver updates zero rows, when update, then returns false`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } returns 0

    // When
    val result = repository.update(CalendarId(1L), CalendarUpdate())

    // Then
    Assert.assertFalse(result)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when update, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.update(CalendarId(1L), CalendarUpdate())
  }

  // endregion

  // region delete

  @Test
  fun `given row is deleted successfully, when delete, then returns true`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 1

    // When
    val result = repository.delete(CalendarId(1L))

    // Then
    Assert.assertTrue(result)
  }

  @Test
  fun `given nothing is deleted, when delete, then returns false`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 0

    // When
    val result = repository.delete(CalendarId(1L))

    // Then
    Assert.assertFalse(result)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when delete, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.delete(CalendarId(1L))
  }

  // endregion

  // region helpers

  private fun emptyCursor(): Cursor {
    // Empty MatrixCursor requires at least one column.
    return MatrixCursor(arrayOf(CalendarContract.Calendars._ID))
  }

  private fun cursorWithRows(vararg rows: Map<String, Any?>): Cursor {
    if (rows.isEmpty()) {
      return emptyCursor()
    }

    val columnNames = rows.first().keys.toTypedArray()
    val cursor = MatrixCursor(columnNames)

    for (row in rows) {
      val rowValues = columnNames.map { columnName -> row[columnName] }.toTypedArray()
      cursor.addRow(rowValues)
    }

    return cursor
  }

  // endregion
}
