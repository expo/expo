package expo.modules.calendar.next.domain.repositories.attendee

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.attendee.AttendeeInput
import expo.modules.calendar.next.domain.dto.attendee.AttendeeUpdate
import expo.modules.calendar.next.domain.model.attendee.AttendeeRole
import expo.modules.calendar.next.domain.model.attendee.AttendeeStatus
import expo.modules.calendar.next.domain.model.attendee.AttendeeType
import expo.modules.calendar.next.domain.wrappers.AttendeeId
import expo.modules.calendar.next.domain.wrappers.EventId
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
        CalendarContract.Attendees.ATTENDEE_TYPE to CalendarContract.Attendees.TYPE_REQUIRED
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

  // endregion

  // region findById

  @Test
  fun `given cursor has a row, when findById, then returns entity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Attendees._ID to 7L,
        CalendarContract.Attendees.ATTENDEE_EMAIL to "bob@example.com",
        CalendarContract.Attendees.ATTENDEE_NAME to "Bob",
        CalendarContract.Attendees.ATTENDEE_RELATIONSHIP to CalendarContract.Attendees.RELATIONSHIP_ORGANIZER,
        CalendarContract.Attendees.ATTENDEE_STATUS to CalendarContract.Attendees.ATTENDEE_STATUS_DECLINED,
        CalendarContract.Attendees.ATTENDEE_TYPE to CalendarContract.Attendees.TYPE_OPTIONAL
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(AttendeeId(7L))

    // Then
    Assert.assertEquals(AttendeeId(7L), result?.id)
    Assert.assertEquals("bob@example.com", result?.email)
    Assert.assertEquals("Bob", result?.name)
    Assert.assertEquals(AttendeeRole.ORGANIZER, result?.role)
    Assert.assertEquals(AttendeeStatus.DECLINED, result?.status)
    Assert.assertEquals(AttendeeType.OPTIONAL, result?.type)
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

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findById, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findById(AttendeeId(7L))
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findById, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findById(AttendeeId(7L))
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
      email = "new@example.com"
    )

    // When
    val result = repository.create(input)

    // Then
    Assert.assertEquals(AttendeeId(88L), result)
  }

  @Test
  fun `given AttendeeInput, when create, then inserts correct values`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "88"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns mockUri

    val input = AttendeeInput(
      eventId = EventId(1L),
      email = "new@example.com",
      name = "New User",
      role = AttendeeRole.ATTENDEE,
      status = AttendeeStatus.ACCEPTED,
      type = AttendeeType.REQUIRED
    )

    // When
    repository.create(input)

    // Then
    Assert.assertEquals(1L, valuesSlot.captured.getAsLong(CalendarContract.Attendees.EVENT_ID).toLong())
    Assert.assertEquals("new@example.com", valuesSlot.captured.getAsString(CalendarContract.Attendees.ATTENDEE_EMAIL))
    Assert.assertEquals("New User", valuesSlot.captured.getAsString(CalendarContract.Attendees.ATTENDEE_NAME))
    Assert.assertEquals(CalendarContract.Attendees.RELATIONSHIP_ATTENDEE, valuesSlot.captured.getAsInteger(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP).toInt())
    Assert.assertEquals(CalendarContract.Attendees.ATTENDEE_STATUS_ACCEPTED, valuesSlot.captured.getAsInteger(CalendarContract.Attendees.ATTENDEE_STATUS).toInt())
    Assert.assertEquals(CalendarContract.Attendees.TYPE_REQUIRED, valuesSlot.captured.getAsInteger(CalendarContract.Attendees.ATTENDEE_TYPE).toInt())
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when create, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    // When / Then
    repository.create(AttendeeInput(eventId = EventId(1L)))
  }

  @Test(expected = IllegalStateException::class)
  fun `given inserted URI without last path segment, when create, then throws IllegalStateException`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns null
    every { contentResolver.insert(any(), any()) } returns mockUri

    // When / Then
    repository.create(AttendeeInput(eventId = EventId(1L)))
  }

  @Test(expected = IllegalArgumentException::class)
  fun `given inserted URI with non numeric last path segment, when create, then throws IllegalArgumentException`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "abc"
    every { contentResolver.insert(any(), any()) } returns mockUri

    // When / Then
    repository.create(AttendeeInput(eventId = EventId(1L)))
  }

  // endregion

  // region update

  @Test
  fun `given AttendeeUpdate with defined fields, when update, then updates only those fields`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = AttendeeUpdate(
      id = AttendeeId(10L),
      email = ValueOrUndefined.Value("updated@example.com"),
      name = ValueOrUndefined.Value("Updated User"),
      role = ValueOrUndefined.Value(AttendeeRole.ORGANIZER),
      status = ValueOrUndefined.Value(AttendeeStatus.TENTATIVE),
      type = ValueOrUndefined.Value(AttendeeType.RESOURCE)
    )

    // When
    repository.update(update)

    // Then
    Assert.assertEquals("updated@example.com", valuesSlot.captured.getAsString(CalendarContract.Attendees.ATTENDEE_EMAIL))
    Assert.assertEquals("Updated User", valuesSlot.captured.getAsString(CalendarContract.Attendees.ATTENDEE_NAME))
    Assert.assertEquals(CalendarContract.Attendees.RELATIONSHIP_ORGANIZER, valuesSlot.captured.getAsInteger(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP).toInt())
    Assert.assertEquals(CalendarContract.Attendees.ATTENDEE_STATUS_TENTATIVE, valuesSlot.captured.getAsInteger(CalendarContract.Attendees.ATTENDEE_STATUS).toInt())
    Assert.assertEquals(CalendarContract.Attendees.TYPE_RESOURCE, valuesSlot.captured.getAsInteger(CalendarContract.Attendees.ATTENDEE_TYPE).toInt())
  }

  @Test
  fun `given AttendeeUpdate with null values, when update, then clears supported nullable fields`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = AttendeeUpdate(
      id = AttendeeId(10L),
      email = ValueOrUndefined.Value<String?>(null),
      name = ValueOrUndefined.Value<String?>(null),
      role = ValueOrUndefined.Value<AttendeeRole?>(null),
      status = ValueOrUndefined.Value<AttendeeStatus?>(null),
      type = ValueOrUndefined.Value<AttendeeType?>(null)
    )

    // When
    repository.update(update)

    // Then
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Attendees.ATTENDEE_EMAIL))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Attendees.ATTENDEE_NAME))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Attendees.ATTENDEE_RELATIONSHIP))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Attendees.ATTENDEE_STATUS))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Attendees.ATTENDEE_TYPE))
  }

  @Test
  fun `given updated rows, when update, then returns true`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } returns 1

    // When
    val result = repository.update(AttendeeUpdate(id = AttendeeId(10L)))

    // Then
    Assert.assertTrue(result)
  }

  @Test
  fun `given zero updated rows, when update, then returns false`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } returns 0

    // When
    val result = repository.update(AttendeeUpdate(id = AttendeeId(10L)))

    // Then
    Assert.assertFalse(result)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when update, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.update(AttendeeUpdate(id = AttendeeId(10L)))
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

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when delete, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.delete(AttendeeId(10L))
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

  // endregion
}
