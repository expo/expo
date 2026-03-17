package expo.modules.calendar.next.domain.repositories.instance

import android.content.ContentResolver
import android.database.Cursor
import android.database.MatrixCursor
import android.provider.CalendarContract
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.wrappers.CalendarId
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
class InstanceRepositoryTest {
  private val contentResolver = mockk<ContentResolver>()
  private val repository = InstanceRepository(contentResolver)

  // region findAll — empty / multiple rows

  @Test
  fun `given cursor has no rows, when findAll, then returns empty list`() = runTest {
    // Given
    val cursor = emptyCursor()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll(0L, 1000L, emptyList())

    // Then
    Assert.assertEquals(emptyList<Any>(), result)
  }

  @Test
  fun `given cursor with data, when findAll, then maps a single cursor row to InstanceEntity`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Instances._ID to 42L,
        CalendarContract.Instances.EVENT_ID to 7L,
        CalendarContract.Instances.BEGIN to 1_000_000L,
        CalendarContract.Instances.END to 2_000_000L,
        CalendarContract.Instances.TITLE to "Meeting",
        CalendarContract.Instances.DESCRIPTION to "Standup",
        CalendarContract.Instances.CALENDAR_ID to "3",
        CalendarContract.Instances.ALL_DAY to 0,
        CalendarContract.Instances.ACCESS_LEVEL to CalendarContract.Events.ACCESS_PUBLIC,
        CalendarContract.Instances.AVAILABILITY to CalendarContract.Events.AVAILABILITY_FREE,
        CalendarContract.Instances.STATUS to CalendarContract.Events.STATUS_CONFIRMED,
        CalendarContract.Instances.EVENT_LOCATION to "Room 1",
        CalendarContract.Instances.EVENT_TIMEZONE to "Europe/Warsaw",
        CalendarContract.Instances.EVENT_END_TIMEZONE to "Europe/Warsaw",
        CalendarContract.Instances.ORGANIZER to "organizer@example.com",
        CalendarContract.Instances.ORIGINAL_ID to null,
        CalendarContract.Instances.RRULE to null,
        CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS to 1,
        CalendarContract.Instances.GUESTS_CAN_MODIFY to 0,
        CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS to 1,
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll(0L, 3_000_000L, emptyList())

    // Then
    Assert.assertEquals(1, result.size)
    val entity = result.first()
    Assert.assertEquals(42L, entity.id)
    Assert.assertEquals(7L, entity.eventId.value)
    Assert.assertEquals(1_000_000L, entity.begin)
    Assert.assertEquals(2_000_000L, entity.end)
    Assert.assertEquals("Meeting", entity.title)
    Assert.assertEquals("Standup", entity.description)
    Assert.assertEquals(3L, entity.calendarId?.value)
    Assert.assertEquals(false, entity.allDay)
    Assert.assertEquals(AccessLevel.PUBLIC, entity.accessLevel)
    Assert.assertEquals(Availability.FREE, entity.availability)
    Assert.assertEquals(Status.CONFIRMED, entity.status)
    Assert.assertEquals("Room 1", entity.eventLocation)
    Assert.assertEquals("Europe/Warsaw", entity.eventTimezone)
    Assert.assertEquals("Europe/Warsaw", entity.eventEndTimezone)
    Assert.assertEquals("organizer@example.com", entity.organizer)
    Assert.assertNull(entity.originalId)
    Assert.assertNull(entity.rrule)
    Assert.assertEquals(true, entity.guestsCanInviteOthers)
    Assert.assertEquals(false, entity.guestsCanModify)
    Assert.assertEquals(true, entity.guestsCanSeeGuests)
  }

  @Test
  fun `given cursor with allDay flag, when findAll, then maps allDay = 1 to true`() = runTest {
    // Given
    val cursor = cursorWithRows(minimalRow(allDay = 1))
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll(0L, 1000L, emptyList())

    // Then
    Assert.assertEquals(true, result.first().allDay)
  }

  @Test
  fun `given cursor with rrule, when findAll, then parses rrule from cursor`() = runTest {
    // Given
    val cursor = cursorWithRows(minimalRow(rrule = "FREQ=WEEKLY;INTERVAL=1"))
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll(0L, 1000L, emptyList())

    // Then
    val rrule = result.first().rrule
    Assert.assertEquals("weekly", rrule?.frequency)
    Assert.assertEquals(1, rrule?.interval)
  }

  @Test
  fun `given cursor with multiple rows, when findAll, then returns multiple entities`() = runTest {
    // Given
    val cursor = cursorWithRows(
      minimalRow(id = 1L, eventId = 10L),
      minimalRow(id = 2L, eventId = 20L),
      minimalRow(id = 3L, eventId = 30L),
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findAll(0L, 1000L, emptyList())

    // Then
    Assert.assertEquals(3, result.size)
    Assert.assertEquals(1L, result[0].id)
    Assert.assertEquals(2L, result[1].id)
    Assert.assertEquals(3L, result[2].id)
  }

  // endregion

  // region findAll — selection / selectionArgs

  @Test
  fun `given no calendarIds, when findAll, then uses only VISIBLE filter`() = runTest {
    // Given
    val selectionSlot = slot<String>()
    val cursor = emptyCursor()
    every {
      contentResolver.query(
        any(),
        any(),
        capture(selectionSlot),
        isNull(),
        any()
      )
    } returns cursor

    // When
    repository.findAll(0L, 1000L, emptyList())

    // Then
    val expectedSelection = "(${CalendarContract.Instances.VISIBLE} = 1)"
    Assert.assertEquals(expectedSelection, selectionSlot.captured)
  }

  @Test
  fun `given multiple calendarIds, when findAll, then adds IN clause to selection`() = runTest {
    // Given
    val selectionSlot = slot<String>()
    val selectionArgsSlot = slot<Array<String>>()
    val cursor = emptyCursor()
    every {
      contentResolver.query(any(), any(), capture(selectionSlot), capture(selectionArgsSlot), any())
    } returns cursor

    // When
    repository.findAll(0L, 1000L, listOf(CalendarId(1L), CalendarId(2L)))

    // Then
    val expectedSelection =
      "(${CalendarContract.Instances.VISIBLE} = 1 AND ${CalendarContract.Instances.CALENDAR_ID} IN (?,?))"
    Assert.assertEquals(expectedSelection, selectionSlot.captured)
    Assert.assertEquals(listOf("1", "2"), selectionArgsSlot.captured.toList())
  }

  @Test
  fun `given single calendarId, when findAll, then uses single placeholder`() = runTest {
    // Given
    val selectionArgsSlot = slot<Array<String>>()
    val cursor = emptyCursor()
    every {
      contentResolver.query(any(), any(), any(), capture(selectionArgsSlot), any())
    } returns cursor

    // When
    repository.findAll(0L, 1000L, listOf(CalendarId(99L)))

    // Then
    Assert.assertEquals(listOf("99"), selectionArgsSlot.captured.toList())
  }

  // endregion

  // region findAll — error handling

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when findAll, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.findAll(0L, 1000L, emptyList())
  }

  @Test(expected = CouldNotExecuteQueryException::class)
  fun `given null cursor, when findAll, then throws CouldNotExecuteQueryException`() = runTest {
    // Given
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns null

    // When / Then
    repository.findAll(0L, 1000L, emptyList())
  }

  // endregion

  // region helpers

  private fun emptyCursor(): Cursor {
    // Empty cursor requires at least one column for MatrixCursor
    return MatrixCursor(arrayOf(CalendarContract.Instances._ID))
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
    eventId: Long = 10L,
    begin: Long = 1_000_000L,
    end: Long = 2_000_000L,
    allDay: Int = 0,
    rrule: String? = null,
  ): Map<String, Any?> = mapOf(
    CalendarContract.Instances._ID to id,
    CalendarContract.Instances.EVENT_ID to eventId,
    CalendarContract.Instances.BEGIN to begin,
    CalendarContract.Instances.END to end,
    CalendarContract.Instances.ALL_DAY to allDay,
    CalendarContract.Instances.TITLE to null,
    CalendarContract.Instances.DESCRIPTION to null,
    CalendarContract.Instances.CALENDAR_ID to null,
    CalendarContract.Instances.ACCESS_LEVEL to null,
    CalendarContract.Instances.AVAILABILITY to null,
    CalendarContract.Instances.STATUS to null,
    CalendarContract.Instances.EVENT_LOCATION to null,
    CalendarContract.Instances.EVENT_TIMEZONE to null,
    CalendarContract.Instances.EVENT_END_TIMEZONE to null,
    CalendarContract.Instances.ORGANIZER to null,
    CalendarContract.Instances.ORIGINAL_ID to null,
    CalendarContract.Instances.RRULE to rrule,
    CalendarContract.Instances.GUESTS_CAN_INVITE_OTHERS to 0,
    CalendarContract.Instances.GUESTS_CAN_MODIFY to 0,
    CalendarContract.Instances.GUESTS_CAN_SEE_GUESTS to 0,
  )

  // endregion
}