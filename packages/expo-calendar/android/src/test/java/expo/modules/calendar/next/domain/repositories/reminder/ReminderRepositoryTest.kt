package expo.modules.calendar.next.domain.repositories.reminder

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.reminder.ReminderInput
import expo.modules.calendar.next.domain.model.reminder.Method
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ReminderId
import expo.modules.calendar.next.exceptions.CouldNotExecuteQueryException
import expo.modules.calendar.next.exceptions.PermissionException
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import kotlinx.coroutines.test.runTest
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReminderRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = ReminderRepository(contentResolver)

  // region findAllByEventId

  @Test
  fun `given cursor has no rows, when findAllByEventId, then returns empty list`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findAllByEventId(EventId(1L))

    // Then
    Assert.assertEquals(emptyList<ReminderEntity>(), result)
  }

  @Test
  fun `given cursor with data, when findAllByEventId, then maps cursor row to ReminderEntity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Reminders._ID to 5L,
        CalendarContract.Reminders.METHOD to CalendarContract.Reminders.METHOD_EMAIL,
        CalendarContract.Reminders.MINUTES to 15
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAllByEventId(EventId(99L))

    // Then
    Assert.assertEquals(1, result.size)
    val entity = result.first()
    Assert.assertEquals(ReminderId(5L), entity.id)
    Assert.assertEquals(EventId(99L), entity.eventId)
    Assert.assertEquals(Method.EMAIL, entity.method)
    Assert.assertEquals(15, entity.minutes)
  }

  @Test
  fun `given event id, when findAllByEventId, then uses EVENT_ID in selection`() = runTest {
    // Given
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    every {
      contentResolver.query(any(), any(), capture(selectionSlot), capture(selectionArgsSlot), any())
    } returns emptyCursor()

    // When
    repository.findAllByEventId(EventId(77L))

    // Then
    Assert.assertTrue(selectionSlot.captured.contains(CalendarContract.Reminders.EVENT_ID))
    Assert.assertEquals(listOf("77"), selectionArgsSlot.captured.toList())
  }

  // endregion

  // region create

  @Test
  fun `given inserted URI, when create, then returns reminder id from URI path segment`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "42"
    every { contentResolver.insert(any(), any()) } returns mockUri

    // When
    val result = repository.create(EventId(1L), ReminderInput(minutes = 15))

    // Then
    Assert.assertEquals(42L, result)
  }

  @Test
  fun `given ReminderInput, when create, then inserts correct values`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "42"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns mockUri

    // When
    repository.create(
      EventId(7L),
      ReminderInput(
        minutes = 15,
        method = Method.EMAIL
      )
    )

    // Then
    Assert.assertEquals(7L, valuesSlot.captured.getAsLong(CalendarContract.Reminders.EVENT_ID).toLong())
    Assert.assertEquals(15, valuesSlot.captured.getAsInteger(CalendarContract.Reminders.MINUTES).toInt())
    Assert.assertEquals(CalendarContract.Reminders.METHOD_EMAIL, valuesSlot.captured.getAsInteger(CalendarContract.Reminders.METHOD).toInt())
  }

  @Test
  fun `given ReminderInput without method, when create, then inserts default method`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "42"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns mockUri

    // When
    repository.create(
      EventId(7L),
      ReminderInput(minutes = 15)
    )

    // Then
    Assert.assertEquals(7L, valuesSlot.captured.getAsLong(CalendarContract.Reminders.EVENT_ID).toLong())
    Assert.assertEquals(15, valuesSlot.captured.getAsInteger(CalendarContract.Reminders.MINUTES).toInt())
    Assert.assertEquals(CalendarContract.Reminders.METHOD_DEFAULT, valuesSlot.captured.getAsInteger(CalendarContract.Reminders.METHOD).toInt())
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when create, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    // When / Then
    repository.create(EventId(1L), ReminderInput(minutes = 15))
  }

  @Test(expected = IllegalStateException::class)
  fun `given inserted URI without last path segment, when create, then throws IllegalStateException`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns null
    every { contentResolver.insert(any(), any()) } returns mockUri

    // When / Then
    repository.create(EventId(1L), ReminderInput(minutes = 15))
  }

  @Test(expected = IllegalArgumentException::class)
  fun `given inserted URI with non numeric last path segment, when create, then throws IllegalArgumentException`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "abc"
    every { contentResolver.insert(any(), any()) } returns mockUri

    // When / Then
    repository.create(EventId(1L), ReminderInput(minutes = 15))
  }

  // endregion

  // region deleteAllByEventId

  @Test
  fun `given event id, when deleteAllByEventId, then calls ContentResolver delete with EVENT_ID selection`() = runTest {
    // Given
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    every {
      contentResolver.delete(any(), capture(selectionSlot), capture(selectionArgsSlot))
    } returns 3

    // When
    repository.deleteAllByEventId(EventId(55L))

    // Then
    Assert.assertTrue(selectionSlot.captured.contains(CalendarContract.Reminders.EVENT_ID))
    Assert.assertEquals(listOf("55"), selectionArgsSlot.captured.toList())
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when deleteAllByEventId, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.deleteAllByEventId(EventId(55L))
  }

  // endregion

  // region exceptions

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findAllByEventId, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findAllByEventId(EventId(1L))
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findAllByEventId, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findAllByEventId(EventId(1L))
  }

  // endregion

  // region helpers

  private fun emptyCursor(): Cursor {
    // Empty cursor requires at least one column for MatrixCursor
    return MatrixCursor(arrayOf(CalendarContract.Reminders._ID))
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
