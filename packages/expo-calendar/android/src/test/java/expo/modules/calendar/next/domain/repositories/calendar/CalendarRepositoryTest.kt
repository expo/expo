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
  fun `given cursor with multiple rows, when findAll, then returns entities preserving order`() = runTest {
    // Given
    val cursor = cursorWithRows(minimalRow(1L), minimalRow(2L), minimalRow(3L))
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll()

    // Then
    val ids = result.map { it.id }
    Assert.assertEquals(listOf(CalendarId(1L), CalendarId(2L), CalendarId(3L)), ids)
  }

  @Test
  fun `given cursor with unknown enum values, when findAll, then filters unknown enum values from allowed lists`() = runTest {
    // Given
    val cursor = cursorWithRows(
      minimalRow() + mapOf(CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES to "0,999,1")
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll()

    // Then
    val types = result.first().allowedAttendeeTypes
    Assert.assertEquals(listOf(AllowedAttendeeType.NONE, AllowedAttendeeType.REQUIRED), types)
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
    val cursor = cursorWithRows(minimalRow(id = 5L, displayName = "Personal"))
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(CalendarId(5L))

    // Then
    Assert.assertEquals(CalendarId(5L).value, result?.id?.value)
    Assert.assertEquals("Personal", result?.calendarDisplayName)
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

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when insert, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    val input = CalendarInput(calendarDisplayName = "New", accountName = "acc", accountType = "type")

    // When / Then
    repository.insert(input)
  }

  // endregion

  // region update

  @Test
  fun `given defined fields, when update, then sends only defined fields to ContentResolver`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val updateData = CalendarUpdate(calendarDisplayName = ValueOrUndefined.Value("Renamed"))

    // When
    repository.update(CalendarId(1L), updateData)

    // Then
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Calendars.CALENDAR_DISPLAY_NAME))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Calendars.NAME))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Calendars.CALENDAR_COLOR))
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

  private fun minimalRow(
    id: Long = 1L,
    displayName: String = "My Calendar"
  ): Map<String, Any?> = mapOf(
    CalendarContract.Calendars._ID to id,
    CalendarContract.Calendars.ACCOUNT_NAME to null,
    CalendarContract.Calendars.ACCOUNT_TYPE to null,
    CalendarContract.Calendars.ALLOWED_ATTENDEE_TYPES to "",
    CalendarContract.Calendars.ALLOWED_AVAILABILITY to "",
    CalendarContract.Calendars.ALLOWED_REMINDERS to "",
    CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL to CalendarContract.Calendars.CAL_ACCESS_NONE,
    CalendarContract.Calendars.CALENDAR_COLOR to 0xFF000000.toInt(),
    CalendarContract.Calendars.CALENDAR_DISPLAY_NAME to displayName,
    CalendarContract.Calendars.CALENDAR_TIME_ZONE to null,
    CalendarContract.Calendars.IS_PRIMARY to 0,
    CalendarContract.Calendars.NAME to null,
    CalendarContract.Calendars.OWNER_ACCOUNT to null,
    CalendarContract.Calendars.SYNC_EVENTS to 1,
    CalendarContract.Calendars.VISIBLE to 1
  )

  // endregion
}
