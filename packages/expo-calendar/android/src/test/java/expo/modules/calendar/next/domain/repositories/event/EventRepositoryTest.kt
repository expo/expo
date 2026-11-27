package expo.modules.calendar.next.domain.repositories.event

import android.content.ContentResolver
import android.content.ContentValues
import android.database.Cursor
import android.database.MatrixCursor
import android.net.Uri
import android.provider.CalendarContract
import expo.modules.calendar.exceptions.EventNotSavedException
import expo.modules.calendar.next.domain.dto.event.EventExceptionInput
import kotlin.time.Duration.Companion.milliseconds
import expo.modules.calendar.next.domain.dto.event.EventInput
import expo.modules.calendar.next.domain.dto.event.EventUpdate
import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.wrappers.CalendarId
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
        CalendarContract.Events.ACCESS_LEVEL to CalendarContract.Events.ACCESS_DEFAULT,
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
        CalendarContract.Events.ORIGINAL_ID to 30L,
        CalendarContract.Events.RRULE to "FREQ=DAILY;INTERVAL=1;UNTIL=20241231T010000Z",
        CalendarContract.Events.STATUS to CalendarContract.Events.STATUS_CONFIRMED,
        CalendarContract.Events.TITLE to "Standup"
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(EventId(42L))

    // Then
    Assert.assertEquals(EventId(42L).value, result?.id?.value)
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
    Assert.assertEquals(EventId(30L).value, result?.originalId?.value)
    Assert.assertEquals("daily", result?.rrule?.frequency)
    Assert.assertEquals(1, result?.rrule?.interval)
    Assert.assertEquals("2024-12-31T01:00:00.000Z", result?.rrule?.endDate)
    Assert.assertEquals(Status.CONFIRMED, result?.status)
    Assert.assertEquals("Standup", result?.title)
  }

  @Test
  fun `given cursor with missing boolean flags, when findById, then maps them to false`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Events._ID to 1L,
        CalendarContract.Events.ACCESS_LEVEL to null,
        CalendarContract.Events.ALL_DAY to null,
        CalendarContract.Events.AVAILABILITY to null,
        CalendarContract.Events.CALENDAR_ID to null,
        CalendarContract.Events.DESCRIPTION to null,
        CalendarContract.Events.DTEND to 2_000_000L,
        CalendarContract.Events.DTSTART to 1_000_000L,
        CalendarContract.Events.EVENT_END_TIMEZONE to null,
        CalendarContract.Events.EVENT_LOCATION to null,
        CalendarContract.Events.EVENT_TIMEZONE to null,
        CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS to null,
        CalendarContract.Events.GUESTS_CAN_MODIFY to null,
        CalendarContract.Events.GUESTS_CAN_SEE_GUESTS to null,
        CalendarContract.Events.ORGANIZER to null,
        CalendarContract.Events.ORIGINAL_ID to null,
        CalendarContract.Events.RRULE to null,
        CalendarContract.Events.STATUS to null,
        CalendarContract.Events.TITLE to null
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(EventId(1L))

    // Then
    Assert.assertEquals(false, result?.allDay)
    Assert.assertEquals(false, result?.guestsCanInviteOthers)
    Assert.assertEquals(false, result?.guestsCanModify)
    Assert.assertEquals(false, result?.guestsCanSeeGuests)
  }

  @Test
  fun `given cursor with unknown enum values, when findById, then maps them to null`() = runTest {
    // Given
    val cursor = cursorWithRows(
      mapOf(
        CalendarContract.Events._ID to 2L,
        CalendarContract.Events.ACCESS_LEVEL to 999,
        CalendarContract.Events.ALL_DAY to 0,
        CalendarContract.Events.AVAILABILITY to 999,
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
        CalendarContract.Events.RRULE to null,
        CalendarContract.Events.STATUS to 999,
        CalendarContract.Events.TITLE to null
      )
    )
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursor

    // When
    val result = repository.findById(EventId(2L))

    // Then
    Assert.assertNull(result?.accessLevel)
    Assert.assertNull(result?.availability)
    Assert.assertNull(result?.status)
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

    val input = EventInput()

    // When
    val result = repository.insert(input)

    // Then
    Assert.assertEquals(99L, result)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when insert, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    val input = EventInput()

    // When / Then
    repository.insert(input)
  }

  @Test(expected = EventNotSavedException::class)
  fun `given non parseable inserted URI, when insert, then throws EventNotSavedException`() = runTest {
    // Given
    val mockUri = mockk<Uri>()
    every { mockUri.lastPathSegment } returns "abc"
    every { contentResolver.insert(any(), any()) } returns mockUri

    val input = EventInput()

    // When / Then
    repository.insert(input)
  }

  @Test
  fun `given EventInput with non-recurrence fields, when insert, then inserts correctly`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { insertedUri.lastPathSegment } returns "99"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns insertedUri

    val input = EventInput(
      calendarId = CalendarId(3L),
      title = "Standup",
      description = "Team sync",
      dtStart = 1_000_000L,
      dtEnd = 1_060_000L,
      availability = Availability.FREE,
      allDay = false,
      eventLocation = "Room 1",
      organizer = "boss@example.com",
      guestsCanModify = false,
      guestsCanInviteOthers = true,
      guestsCanSeeGuests = true,
      eventTimezone = "Europe/Warsaw",
      eventEndTimezone = "Europe/Warsaw",
      accessLevel = AccessLevel.DEFAULT
    )

    // When
    repository.insert(input)

    // Then
    Assert.assertEquals(3L, valuesSlot.captured.getAsLong(CalendarContract.Events.CALENDAR_ID).toLong())
    Assert.assertEquals("Standup", valuesSlot.captured.getAsString(CalendarContract.Events.TITLE))
    Assert.assertEquals("Team sync", valuesSlot.captured.getAsString(CalendarContract.Events.DESCRIPTION))
    Assert.assertEquals(1_000_000L, valuesSlot.captured.getAsLong(CalendarContract.Events.DTSTART).toLong())
    Assert.assertEquals(1_060_000L, valuesSlot.captured.getAsLong(CalendarContract.Events.DTEND).toLong())
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Events.RRULE))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Events.LAST_DATE))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Events.DURATION))
    Assert.assertEquals(CalendarContract.Events.AVAILABILITY_FREE, valuesSlot.captured.getAsInteger(CalendarContract.Events.AVAILABILITY).toInt())
    Assert.assertEquals(false, valuesSlot.captured.getAsBoolean(CalendarContract.Events.ALL_DAY))
    Assert.assertEquals("Room 1", valuesSlot.captured.getAsString(CalendarContract.Events.EVENT_LOCATION))
    Assert.assertEquals("boss@example.com", valuesSlot.captured.getAsString(CalendarContract.Events.ORGANIZER))
    Assert.assertEquals(false, valuesSlot.captured.getAsBoolean(CalendarContract.Events.GUESTS_CAN_MODIFY))
    Assert.assertEquals(true, valuesSlot.captured.getAsBoolean(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS))
    Assert.assertEquals(true, valuesSlot.captured.getAsBoolean(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS))
    Assert.assertEquals("Europe/Warsaw", valuesSlot.captured.getAsString(CalendarContract.Events.EVENT_TIMEZONE))
    Assert.assertEquals("Europe/Warsaw", valuesSlot.captured.getAsString(CalendarContract.Events.EVENT_END_TIMEZONE))
    Assert.assertEquals(CalendarContract.Events.ACCESS_DEFAULT, valuesSlot.captured.getAsInteger(CalendarContract.Events.ACCESS_LEVEL).toInt())
  }

  @Test
  fun `given recurring event with occurrence, when insert, then stores duration`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { insertedUri.lastPathSegment } returns "99"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns insertedUri

    val input = EventInput(
      dtStart = 1_000_000L,
      dtEnd = 1_060_000L,
      rrule = RecurrenceRule(
        frequency = "weekly",
        interval = 2,
        occurrence = 5,
        endDate = null
      )
    )

    // When
    repository.insert(input)

    // Then
    Assert.assertEquals("FREQ=WEEKLY;INTERVAL=2;COUNT=5", valuesSlot.captured.getAsString(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DTEND))
    Assert.assertEquals("PT60S", valuesSlot.captured.getAsString(CalendarContract.Events.DURATION))
  }

  @Test
  fun `given recurring event with endDate, when insert, then stores duration and serializes until`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    val recurrence = RecurrenceRule(
      frequency = "weekly",
      interval = 2,
      occurrence = null,
      endDate = "2025-01-01T00:00:00.000Z"
    )
    every { insertedUri.lastPathSegment } returns "99"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns insertedUri

    val input = EventInput(
      dtStart = 1_000_000L,
      dtEnd = 1_060_000L,
      rrule = recurrence
    )

    // When
    repository.insert(input)

    // Then
    Assert.assertEquals(recurrence.toRuleString(), valuesSlot.captured.getAsString(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DTEND))
    Assert.assertEquals("PT60S", valuesSlot.captured.getAsString(CalendarContract.Events.DURATION))
  }

  @Test
  fun `given recurring event without end date or occurrence, when insert, then clears dtEnd and writes duration`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { insertedUri.lastPathSegment } returns "99"
    every { contentResolver.insert(any(), capture(valuesSlot)) } returns insertedUri

    val input = EventInput(
      dtStart = 1_000_000L,
      dtEnd = 1_060_000L,
      rrule = RecurrenceRule(
        frequency = "weekly",
        interval = 2,
        occurrence = null,
        endDate = null
      )
    )

    // When
    repository.insert(input)

    // Then
    Assert.assertEquals("FREQ=WEEKLY;INTERVAL=2", valuesSlot.captured.getAsString(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DTEND))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.LAST_DATE))
    Assert.assertEquals("PT60S", valuesSlot.captured.getAsString(CalendarContract.Events.DURATION))
  }

  // region insertException

  @Test
  fun `given cancellation input, when insertException, then inserts into event exception URI with cancellation values`() = runTest {
    // Given
    val uriSlot = slot<Uri>()
    val valuesSlot = slot<ContentValues>()
    val insertedUri = mockk<Uri>()
    every { contentResolver.insert(capture(uriSlot), capture(valuesSlot)) } returns insertedUri

    val eventId = EventId(42L)
    val instanceStartDate = 1_000_000L.milliseconds
    val input = EventExceptionInput.Cancellation(instanceStartDate)

    // When
    repository.insertException(eventId, input)

    // Then
    Assert.assertEquals(eventId.value.toString(), uriSlot.captured.lastPathSegment)
    Assert.assertEquals(
      instanceStartDate.inWholeMilliseconds,
      valuesSlot.captured.getAsLong(CalendarContract.Events.ORIGINAL_INSTANCE_TIME).toLong()
    )
    Assert.assertEquals(
      CalendarContract.Events.STATUS_CANCELED,
      valuesSlot.captured.getAsInteger(CalendarContract.Events.STATUS).toInt()
    )
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when insertException, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.insert(any(), any()) } throws SecurityException()

    // When / Then
    repository.insertException(EventId(42L), EventExceptionInput.Cancellation(1_000_000L.milliseconds))
  }

  // endregion

  // region update

  @Test
  fun `given EventUpdate with non-recurrence fields, when update, then updates correctly`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(CalendarContract.Events._ID to 42L)
    )
    val update = EventUpdate(
      dtStart = ValueOrUndefined.Value(1_000_000L),
      dtEnd = ValueOrUndefined.Value(1_060_000L),
      availability = ValueOrUndefined.Value(Availability.FREE),
      title = ValueOrUndefined.Value("Standup"),
      description = ValueOrUndefined.Value("Team sync"),
      eventLocation = ValueOrUndefined.Value("Room 1"),
      organizer = ValueOrUndefined.Value("boss@example.com"),
      allDay = ValueOrUndefined.Value(false),
      guestsCanModify = ValueOrUndefined.Value(false),
      guestsCanInviteOthers = ValueOrUndefined.Value(true),
      guestsCanSeeGuests = ValueOrUndefined.Value(true),
      accessLevel = ValueOrUndefined.Value(AccessLevel.DEFAULT),
      eventTimezone = ValueOrUndefined.Value("Europe/Warsaw"),
      eventEndTimezone = ValueOrUndefined.Value("Europe/Warsaw")
    )

    // When
    repository.update(EventId(42L), update)

    // Then
    Assert.assertEquals(1_000_000L, valuesSlot.captured.getAsLong(CalendarContract.Events.DTSTART).toLong())
    Assert.assertEquals("Standup", valuesSlot.captured.getAsString(CalendarContract.Events.TITLE))
    Assert.assertEquals("Team sync", valuesSlot.captured.getAsString(CalendarContract.Events.DESCRIPTION))
    Assert.assertEquals(1_060_000L, valuesSlot.captured.getAsLong(CalendarContract.Events.DTEND).toLong())
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Events.RRULE))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Events.LAST_DATE))
    Assert.assertFalse(valuesSlot.captured.containsKey(CalendarContract.Events.DURATION))
    Assert.assertEquals(CalendarContract.Events.AVAILABILITY_FREE, valuesSlot.captured.getAsInteger(CalendarContract.Events.AVAILABILITY).toInt())
    Assert.assertEquals(false, valuesSlot.captured.getAsBoolean(CalendarContract.Events.ALL_DAY))
    Assert.assertEquals("Room 1", valuesSlot.captured.getAsString(CalendarContract.Events.EVENT_LOCATION))
    Assert.assertEquals("boss@example.com", valuesSlot.captured.getAsString(CalendarContract.Events.ORGANIZER))
    Assert.assertEquals(false, valuesSlot.captured.getAsBoolean(CalendarContract.Events.GUESTS_CAN_MODIFY))
    Assert.assertEquals(true, valuesSlot.captured.getAsBoolean(CalendarContract.Events.GUESTS_CAN_INVITE_OTHERS))
    Assert.assertEquals(true, valuesSlot.captured.getAsBoolean(CalendarContract.Events.GUESTS_CAN_SEE_GUESTS))
    Assert.assertEquals("Europe/Warsaw", valuesSlot.captured.getAsString(CalendarContract.Events.EVENT_TIMEZONE))
    Assert.assertEquals("Europe/Warsaw", valuesSlot.captured.getAsString(CalendarContract.Events.EVENT_END_TIMEZONE))
    Assert.assertEquals(CalendarContract.Events.ACCESS_DEFAULT, valuesSlot.captured.getAsInteger(CalendarContract.Events.ACCESS_LEVEL).toInt())
  }

  @Test
  fun `given updated rows, when update, then returns true`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } returns 1

    // When
    val result = repository.update(EventId(42L), EventUpdate())

    // Then
    Assert.assertTrue(result)
  }

  @Test
  fun `given zero updated rows, when update, then returns false`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } returns 0

    // When
    val result = repository.update(EventId(42L), EventUpdate())

    // Then
    Assert.assertFalse(result)
  }

  @Test(expected = PermissionException::class)
  fun `given SecurityException, when update, then throws PermissionException`() = runTest {
    // Given
    every { contentResolver.update(any(), any(), any(), any()) } throws SecurityException()

    // When / Then
    repository.update(EventId(42L), EventUpdate())
  }

  @Test
  fun `given recurring update with occurrence, when update, then stores duration`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = EventUpdate(
      allDay = ValueOrUndefined.Value(false),
      dtStart = ValueOrUndefined.Value(1_000_000L),
      dtEnd = ValueOrUndefined.Value(1_060_000L),
      rrule = ValueOrUndefined.Value(
        RecurrenceRule(
          frequency = "weekly",
          interval = 2,
          occurrence = 5,
          endDate = null
        )
      )
    )

    // When
    repository.update(EventId(42L), update)

    // Then
    Assert.assertEquals("FREQ=WEEKLY;INTERVAL=2;COUNT=5", valuesSlot.captured.getAsString(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DTEND))
    Assert.assertEquals("PT60S", valuesSlot.captured.getAsString(CalendarContract.Events.DURATION))
  }

  @Test
  fun `given recurring update with endDate, when update, then stores duration and serializes until`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    val recurrence = RecurrenceRule(
      frequency = "weekly",
      interval = 2,
      occurrence = null,
      endDate = "2025-01-01T00:00:00.000Z"
    )
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = EventUpdate(
      allDay = ValueOrUndefined.Value(false),
      dtStart = ValueOrUndefined.Value(1_000_000L),
      dtEnd = ValueOrUndefined.Value(1_060_000L),
      rrule = ValueOrUndefined.Value(recurrence)
    )

    // When
    repository.update(EventId(42L), update)

    // Then
    Assert.assertEquals(recurrence.toRuleString(), valuesSlot.captured.getAsString(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DTEND))
    Assert.assertEquals("PT60S", valuesSlot.captured.getAsString(CalendarContract.Events.DURATION))
  }

  @Test
  fun `given recurring update without end date or occurrence, when update, then clears dtEnd and writes duration`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = EventUpdate(
      allDay = ValueOrUndefined.Value(false),
      dtStart = ValueOrUndefined.Value(1_000_000L),
      dtEnd = ValueOrUndefined.Value(1_060_000L),
      rrule = ValueOrUndefined.Value(
        RecurrenceRule(
          frequency = "weekly",
          interval = 2,
          occurrence = null,
          endDate = null
        )
      )
    )

    // When
    repository.update(EventId(42L), update)

    // Then
    Assert.assertEquals("FREQ=WEEKLY;INTERVAL=2", valuesSlot.captured.getAsString(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DTEND))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.LAST_DATE))
    Assert.assertEquals("PT60S", valuesSlot.captured.getAsString(CalendarContract.Events.DURATION))
  }

  @Test
  fun `given recurring update with empty frequency, when update, then clears recurrence field`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    val update = EventUpdate(
      allDay = ValueOrUndefined.Value(false),
      dtStart = ValueOrUndefined.Value(1_000_000L),
      dtEnd = ValueOrUndefined.Value(1_060_000L),
      rrule = ValueOrUndefined.Value(
        RecurrenceRule(
          frequency = "",
          interval = 2,
          occurrence = null,
          endDate = null
        )
      )
    )

    // When
    repository.update(EventId(42L), update)

    // Then
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.RRULE))
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Events.DURATION))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DURATION))
  }

  @Test
  fun `given null recurrence update, when update, then clears recurrence field`() = runTest {
    // Given
    val valuesSlot = slot<ContentValues>()
    every { contentResolver.update(any(), capture(valuesSlot), any(), any()) } returns 1

    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.Events._ID to 42L,
        CalendarContract.Events.DTSTART to 1000L,
        CalendarContract.Events.DURATION to "PT1H30M",
        CalendarContract.Events.RRULE to "FREQ=DAILY"
      )
    )
    val update = EventUpdate(
      rrule = ValueOrUndefined.Value(null)
    )

    // When
    repository.update(EventId(42L), update)

    // Then
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Events.RRULE))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.RRULE))
    Assert.assertEquals(5_401_000L, valuesSlot.captured.getAsLong(CalendarContract.Events.DTEND).toLong())
    Assert.assertTrue(valuesSlot.captured.containsKey(CalendarContract.Events.DURATION))
    Assert.assertNull(valuesSlot.captured.get(CalendarContract.Events.DURATION))
  }

  // endregion

  @Test
  fun `updating just the end of a recurring event recomputes duration`() = runTest {
    val values = slot<ContentValues>()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.Events._ID to 42L,
        CalendarContract.Events.DTSTART to 1000L,
        CalendarContract.Events.DURATION to "P3600S",
        CalendarContract.Events.RRULE to "FREQ=WEEKLY"
      )
    )
    every { contentResolver.update(any(), capture(values), any(), any()) } returns 1

    repository.update(EventId(42L), EventUpdate(dtEnd = ValueOrUndefined.Value(7_201_000L)))

    Assert.assertNull(values.captured.get(CalendarContract.Events.DTEND))
    Assert.assertEquals("PT7200S", values.captured.getAsString(CalendarContract.Events.DURATION))
    Assert.assertFalse(values.captured.containsKey(CalendarContract.Events.RRULE))
  }

  @Test
  fun `moving a series start alone preserves the duration`() = runTest {
    val values = slot<ContentValues>()
    every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
      mapOf(
        CalendarContract.Events._ID to 42L,
        CalendarContract.Events.DTSTART to 1000L,
        CalendarContract.Events.DURATION to "PT3600S",
        CalendarContract.Events.RRULE to "FREQ=WEEKLY"
      )
    )
    every { contentResolver.update(any(), capture(values), any(), any()) } returns 1
    repository.update(EventId(42L), EventUpdate(dtStart = ValueOrUndefined.Value(86_401_000L)))
    Assert.assertEquals("PT3600S", values.captured.getAsString(CalendarContract.Events.DURATION))
    Assert.assertEquals(86_401_000L, values.captured.getAsLong(CalendarContract.Events.DTSTART).toLong())
  }

  @Test
  fun `all day recurrence uses whole days for duration`() = runTest {
    val values = slot<ContentValues>()
    every { contentResolver.insert(any(), capture(values)) } returns Uri.parse("content://com.android.calendar/events/42")
    repository.insert(EventInput(dtStart = 0L, dtEnd = 172_800_000L, allDay = true, rrule = RecurrenceRule("weekly", 1, 5, null)))
    Assert.assertEquals("P2D", values.captured.getAsString(CalendarContract.Events.DURATION))
    Assert.assertNull(values.captured.get(CalendarContract.Events.DTEND))
  }

  @Test
  fun `read duration recovers the occurrence end from common provider formats`() = runTest {
    for ((text, expected) in mapOf(
      "P3600S" to 3_600_000L,
      "PT3600S" to 3_600_000L,
      "PT1H30M" to 5_400_000L,
      "P1W" to 604_800_000L,
      "P2DT1H" to 176_400_000L,
      "P" to null,
      "PT" to null,
      "P99999999999999999999999999D" to null
    )) {
      every { contentResolver.query(any(), any(), any(), any(), any()) } returns cursorWithRows(
        mapOf(CalendarContract.Events._ID to 42L, CalendarContract.Events.DTSTART to 0L, CalendarContract.Events.DURATION to text)
      )
      Assert.assertEquals(text, expected, repository.findById(EventId(42))?.dtEnd)
    }
  }

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

    val columnNames = EventRepository.FULL_PROJECTION
    val cursor = MatrixCursor(columnNames)

    for (row in rows) {
      val rowValues = columnNames.map { columnName -> row[columnName] }.toTypedArray()
      cursor.addRow(rowValues)
    }

    return cursor
  }
  // endregion
}
