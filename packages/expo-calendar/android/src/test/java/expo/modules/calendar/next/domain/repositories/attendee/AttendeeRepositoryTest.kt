package expo.modules.calendar.next.domain.repositories.attendee

import android.content.ContentResolver
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.attendee.AttendeeInput
import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.calendar.next.domain.wrappers.EventId
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
class AttendeeRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = AttendeeRepository(contentResolver)

  // region findAllByEventId

  @Test
  fun `given cursor has no rows, when findAllByEventId, then returns empty list`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findAllByEventId(EventId(1L))

    // Then
    Assert.assertEquals(emptyList<Any>(), result)
  }

  @Test
  fun `given cursor with data, when findAllByEventId, then maps cursor rows to AttendeeEntity list`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Attendees._ID to 10L,
        CalendarContract.Attendees.ATTENDEE_EMAIL to "alice@example.com",
        CalendarContract.Attendees.ATTENDEE_NAME to "Alice",
        CalendarContract.Attendees.ATTENDEE_RELATIONSHIP to CalendarContract.Attendees.RELATIONSHIP_ATTENDEE,
        CalendarContract.Attendees.ATTENDEE_STATUS to CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED,
        CalendarContract.Attendees.ATTENDEE_TYPE to CalendarContract.Attendees.TYPE_REQUIRED,
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAllByEventId(EventId(5L))

    // Then
    Assert.assertEquals(1, result.size)
    val entity = result.first()
    Assert.assertEquals(AttendeeId(10L), entity.id)
    Assert.assertEquals("alice@example.com", entity.email)
    Assert.assertEquals("Alice", entity.name)
    Assert.assertEquals(AttendeeRole.ATTENDEE, entity.role)
    Assert.assertEquals(AttendeeStatus.ACCEPTED, entity.status)
    Assert.assertEquals(AttendeeType.REQUIRED, entity.type)
  }

  @Test
  fun `given event id, when findAllByEventId, then uses EVENT_ID in selection`() = runTest {
    // Given
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    every {
      contentResolver.query(
        any(),
        any(),
        capture(selectionSlot),
        capture(selectionArgsSlot),
        any()
      )
    } returns emptyCursor()

    // When
    repository.findAllByEventId(EventId(42L))

    // Then
    Assert.assertTrue(selectionSlot.captured.contains(CalendarContract.Attendees.EVENT_ID))
    Assert.assertEquals(listOf("42"), selectionArgsSlot.captured?.toList())
  }

  @Test
  fun `given cursor with multiple rows, when findAllByEventId, then returns multiple entities`() = runTest {
    // Given
    val cursor = cursorWithRows(
      minimalRow(id = 1L, email = "a@example.com"),
      minimalRow(id = 2L, email = "b@example.com"),
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAllByEventId(EventId(1L))

    // Then
    Assert.assertEquals(2, result.size)
    Assert.assertEquals(AttendeeId(1L), result[0].id)
    Assert.assertEquals(AttendeeId(2L), result[1].id)
  }

  // endregion

  // region findById

  @Test
  fun `given cursor has a row, when findById, then returns entity`() = runTest {
    // Given
    val cursor = cursorWithRows(minimalRow(id = 7L, email = "bob@example.com"))
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(AttendeeId(7L))

    // Then
    Assert.assertEquals(AttendeeId(7L), result?.id)
    Assert.assertEquals("bob@example.com", result?.email)
  }

  @Test
  fun `given cursor has no rows, when findById, then returns null`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findById(AttendeeId(7L))

    // Then
    Assert.assertNull(result)
  }

  // endregion

  // region create

  @Test
  fun `given inserted URI, when create, then returns AttendeeId from URI path segment`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "88"
    every { contentResolver.insert(any(), any()) } returns mockUri

    val input = AttendeeInput(
      eventId = EventId(1L),
      email = "new@example.com",
    )

    // When
    val result = repository.create(input)

    // Then
    Assert.assertEquals(AttendeeId(88L), result)
  }

  // endregion

  // region delete

  @Test
  fun `given row is deleted successfully, when delete, then returns true`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 1

    // When
    val result = repository.delete(AttendeeId(10L))

    // Then
    Assert.assertTrue(result)
  }

  @Test
  fun `given nothing is deleted, when delete, then returns false`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 0

    // When
    val result = repository.delete(AttendeeId(10L))

    // Then
    Assert.assertFalse(result)
  }

  @Test
  fun `given attendee id, when delete, then uses attendee-specific URI`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    every { contentResolver.delete(capture(uriSlot), any(), any()) } returns 1

    // When
    repository.delete(AttendeeId(33L))

    // Then
    Assert.assertEquals("33", uriSlot.captured.lastPathSegment)
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
    // Empty MatrixCursor requires at least one column.
    return MatrixCursor(arrayOf(CalendarContract.Attendees._ID))
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
    email: String? = null,
  ): Map<String, Any?> = mapOf(
    CalendarContract.Attendees._ID to id,
    CalendarContract.Attendees.ATTENDEE_EMAIL to email,
    CalendarContract.Attendees.ATTENDEE_NAME to null,
    CalendarContract.Attendees.ATTENDEE_RELATIONSHIP to null,
    CalendarContract.Attendees.ATTENDEE_STATUS to null,
    CalendarContract.Attendees.ATTENDEE_TYPE to null,
  )

  // endregion
}