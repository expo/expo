package expo.modules.calendar.next.domain.repositories.event

import android.content.ContentResolver
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.dto.event.EventInput
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.Status
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
class EventRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = EventRepository(contentResolver)

  // region findById

  @Test
  fun `given cursor has no rows, when findById, then returns null`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns emptyCursor()

    // When
    val result = repository.findById(EventId(1L))

    // Then
    Assert.assertNull(result)
  }

  @Test
  fun `given cursor with data, when findById, then maps a cursor row to EventEntity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Events._ID to 42L,
        CalendarContract.Events.ALL_DAY to 0,
        CalendarContract.Events.AVAILABILITY to CalendarContract.Events.AVAILABILITY_FREE,
        CalendarContract.Events.CALENDAR_ID to 3L,
        CalendarContract.Events.DESCRIPTION to "Team sync",
        CalendarContract.Events.DTEND to 2_000_000L,
        CalendarContract.Events.DTSTART to 1_000_000L,
        CalendarContract.Events.EVENT_END_TIMEZONE to "Europe/Warsaw",
        CalendarContract.Events.EVENT_LOCATION to "Room 1",
        CalendarContract.Events.EVENT_TIMEZONE to "Europe/Warsaw",
        CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS to 1,
        CalendarContract.Events.GUESTS_CAN_MODIFY to 0,
        CalendarContract.Events.GUESTS_CAN_SEE_GUESTS to 1,
        CalendarContract.Events.ORGANIZER to "boss@example.com",
        CalendarContract.Events.ORIGINAL_ID to null,
        CalendarContract.Events.RRULE to null,
        CalendarContract.Events.STATUS to CalendarContract.Events.STATUS_CONFIRMED,
        CalendarContract.Events.TITLE to "Standup",
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(EventId(42L))

    // Then
    Assert.assertEquals(EventId(42L), result?.id)
    Assert.assertEquals(false, result?.allDay)
    Assert.assertEquals(Availability.FREE, result?.availability)
    Assert.assertEquals(3L, result?.calendarId?.value)
    Assert.assertEquals("Team sync", result?.description)
    Assert.assertEquals(2_000_000L, result?.dtEnd)
    Assert.assertEquals(1_000_000L, result?.dtStart)
    Assert.assertEquals("Europe/Warsaw", result?.eventEndTimezone)
    Assert.assertEquals("Room 1", result?.eventLocation)
    Assert.assertEquals("Europe/Warsaw", result?.eventTimezone)
    Assert.assertEquals(true, result?.guestsCanInviteOthers)
    Assert.assertEquals(false, result?.guestsCanModify)
    Assert.assertEquals(true, result?.guestsCanSeeGuests)
    Assert.assertEquals("boss@example.com", result?.organizer)
    Assert.assertNull(result?.originalId)
    Assert.assertNull(result?.rrule)
    Assert.assertEquals(Status.CONFIRMED, result?.status)
    Assert.assertEquals("Standup", result?.title)
  }

  @Test
  fun `given cursor with rrule, when findById, then parses rrule from cursor`() = runTest {
    // Given
    val cursor = cursorWithRows(minimalRow(rrule = "FREQ=WEEKLY;INTERVAL=2"))
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(EventId(1L))

    // Then
    Assert.assertEquals("weekly", result?.rrule?.frequency)
    Assert.assertEquals(2, result?.rrule?.interval)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findById, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findById(EventId(1L))
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findById, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findById(EventId(1L))
  }

  // endregion

  // region insert

  @Test
  fun `given inserted URI, when insert, then returns event id from URI path segment`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "99"
    every { contentResolver.insert(any(), any()) } returns mockUri

    val input = EventInput(
      dtStart = 1_000_000L,
      dtEnd = 2_000_000L,
    )

    // When
    val result = repository.insert(input)

    // Then
    Assert.assertEquals(99L, result)
  }

  // endregion

  // region remove

  @Test
  fun `given row is deleted successfully, when remove, then returns true`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 1

    // When
    val result = repository.remove(EventId(42L))

    // Then
    Assert.assertTrue(result)
  }

  @Test
  fun `given nothing is deleted, when remove, then returns false`() = runTest {
    // Given
    every { contentResolver.delete(any(), any(), any()) } returns 0

    // When
    val result = repository.remove(EventId(42L))

    // Then
    Assert.assertFalse(result)
  }

  @Test
  fun `given event id, when remove, then uses event-specific URI`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    every { contentResolver.delete(capture(uriSlot), any(), any()) } returns 1

    // When
    repository.remove(EventId(55L))

    // Then
    Assert.assertEquals("55", uriSlot.captured.lastPathSegment)
  }

  // endregion

  // region helpers

  private fun emptyCursor(): Cursor {
    // Empty MatrixCursor requires at least one column.
    return MatrixCursor(arrayOf(CalendarContract.Events._ID))
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
    rrule: String? = null,
  ): Map<String, Any?> = mapOf(
    CalendarContract.Events._ID to id,
    CalendarContract.Events.ALL_DAY to 0,
    CalendarContract.Events.AVAILABILITY to null,
    CalendarContract.Events.CALENDAR_ID to null,
    CalendarContract.Events.DESCRIPTION to null,
    CalendarContract.Events.DTEND to 2_000_000L,
    CalendarContract.Events.DTSTART to 1_000_000L,
    CalendarContract.Events.EVENT_END_TIMEZONE to null,
    CalendarContract.Events.EVENT_LOCATION to null,
    CalendarContract.Events.EVENT_TIMEZONE to null,
    CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS to 0,
    CalendarContract.Events.GUESTS_CAN_MODIFY to 0,
    CalendarContract.Events.GUESTS_CAN_SEE_GUESTS to 0,
    CalendarContract.Events.ORGANIZER to null,
    CalendarContract.Events.ORIGINAL_ID to null,
    CalendarContract.Events.RRULE to rrule,
    CalendarContract.Events.STATUS to null,
    CalendarContract.Events.TITLE to null,
  )

  // endregion
}