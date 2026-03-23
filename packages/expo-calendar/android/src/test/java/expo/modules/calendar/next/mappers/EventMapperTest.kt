package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.EventEntity
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventRecord
import expo.modules.calendar.next.records.EventStatus
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.dateToMilliseconds
import expo.modules.kotlin.types.ValueOrUndefined
import org.junit.Assert
import org.junit.Test

class EventMapperTest {
  private val mapper = EventMapper()

  @Test
  fun `given EventRecord New, when toDomainEventInput, then maps fields enums and recurrence`() {
    // Given
    val record = EventRecord.New(
      startDate = "2026-03-23T10:00:00.000Z",
      endDate = "2026-03-23T11:00:00.000Z",
      title = "Meeting",
      location = "Room 1",
      timeZone = "Europe/Warsaw",
      endTimeZone = "Europe/Warsaw",
      notes = "Standup",
      recurrenceRule = RecurrenceRuleRecord(
        frequency = "weekly",
        interval = 1,
        occurrence = 5,
        endDate = null
      ),
      allDay = true,
      availability = EventAvailability.FREE,
      organizerEmail = "organizer@example.com",
      accessLevel = EventAccessLevel.PUBLIC,
      guestsCanModify = true,
      guestsCanInviteOthers = false,
      guestsCanSeeGuests = true
    )

    // When
    val result = mapper.toDomainEventInput(CalendarId(7L), record)

    // Then
    Assert.assertEquals(CalendarId(7L), result.calendarId)
    Assert.assertEquals("Meeting", result.title)
    Assert.assertEquals("Standup", result.description)
    Assert.assertEquals(dateToMilliseconds("2026-03-23T10:00:00.000Z"), result.dtStart)
    Assert.assertEquals(dateToMilliseconds("2026-03-23T11:00:00.000Z"), result.dtEnd)
    Assert.assertEquals(Availability.FREE, result.availability)
    Assert.assertEquals(true, result.allDay)
    Assert.assertEquals("Room 1", result.eventLocation)
    Assert.assertEquals("organizer@example.com", result.organizer)
    Assert.assertEquals(true, result.guestsCanModify)
    Assert.assertEquals(false, result.guestsCanInviteOthers)
    Assert.assertEquals(true, result.guestsCanSeeGuests)
    Assert.assertEquals("Europe/Warsaw", result.eventTimezone)
    Assert.assertEquals("Europe/Warsaw", result.eventEndTimezone)
    Assert.assertEquals(AccessLevel.PUBLIC, result.accessLevel)
    Assert.assertEquals(
      RecurrenceRule(
        frequency = "weekly",
        interval = 1,
        occurrence = 5,
        endDate = null
      ),
      result.rrule
    )
  }

  @Test
  fun `given EventUpdateRecord, when toEventUpdate, then preserves undefined and maps explicit values`() {
    // Given
    val record = EventUpdateRecord(
      title = ValueOrUndefined.Value("Updated"),
      startDate = ValueOrUndefined.Value("2026-03-24T10:00:00.000Z"),
      endDate = ValueOrUndefined.Undefined(),
      location = ValueOrUndefined.Value(null),
      timeZone = ValueOrUndefined.Value("Europe/Warsaw"),
      endTimeZone = ValueOrUndefined.Undefined(),
      notes = ValueOrUndefined.Value("Updated notes"),
      recurrenceRule = ValueOrUndefined.Value(
        RecurrenceRuleRecord(
          frequency = "monthly",
          interval = 2,
          occurrence = null,
          endDate = "2026-05-01T10:00:00.000Z"
        )
      ),
      allDay = ValueOrUndefined.Value(false),
      availability = ValueOrUndefined.Value(EventAvailability.TENTATIVE),
      organizerEmail = ValueOrUndefined.Value(null),
      accessLevel = ValueOrUndefined.Value(EventAccessLevel.PRIVATE),
      guestsCanModify = ValueOrUndefined.Value(true),
      guestsCanInviteOthers = ValueOrUndefined.Undefined(),
      guestsCanSeeGuests = ValueOrUndefined.Value(null)
    )

    // When
    val result = mapper.toEventUpdate(record)

    // Then
    Assert.assertEquals("Updated", result.title.optional)
    Assert.assertEquals(dateToMilliseconds("2026-03-24T10:00:00.000Z"), result.dtStart.optional)
    Assert.assertTrue(result.dtEnd.isUndefined)
    Assert.assertNull(result.dtEnd.optional)
    Assert.assertNull(result.eventLocation.optional)
    Assert.assertEquals("Europe/Warsaw", result.eventTimezone.optional)
    Assert.assertTrue(result.eventEndTimezone.isUndefined)
    Assert.assertNull(result.eventEndTimezone.optional)
    Assert.assertEquals("Updated notes", result.description.optional)
    Assert.assertEquals(false, result.allDay.optional)
    Assert.assertEquals(Availability.TENTATIVE, result.availability.optional)
    Assert.assertNull(result.organizer.optional)
    Assert.assertEquals(AccessLevel.PRIVATE, result.accessLevel.optional)
    Assert.assertEquals(true, result.guestsCanModify.optional)
    Assert.assertTrue(result.guestsCanInviteOthers.isUndefined)
    Assert.assertNull(result.guestsCanSeeGuests.optional)
    Assert.assertEquals(
      RecurrenceRule(
        frequency = "monthly",
        interval = 2,
        occurrence = null,
        endDate = "2026-05-01T10:00:00.000Z"
      ),
      result.rrule.optional
    )
  }

  @Test
  fun `given EventRecord Existing, when toInstanceEntity, then maps booleans status and required ids`() {
    // Given
    val record = EventRecord.Existing(
      id = "42",
      startDate = "2026-03-23T10:00:00.000Z",
      endDate = "2026-03-23T11:00:00.000Z",
      calendarId = "3",
      title = "Meeting",
      location = "Room 1",
      timeZone = "Europe/Warsaw",
      endTimeZone = "Europe/Warsaw",
      notes = "Standup",
      recurrenceRule = RecurrenceRuleRecord(
        frequency = "weekly",
        interval = 1,
        occurrence = null,
        endDate = null
      ),
      allDay = null,
      availability = EventAvailability.BUSY,
      status = EventStatus.CONFIRMED,
      organizerEmail = "organizer@example.com",
      accessLevel = EventAccessLevel.CONFIDENTIAL,
      guestsCanModify = null,
      guestsCanInviteOthers = true,
      guestsCanSeeGuests = false,
      originalId = "12",
      instanceId = "99"
    )

    // When
    val result = mapper.toInstanceEntity(record)

    // Then
    Assert.assertEquals(99L, result.id)
    Assert.assertEquals(EventId(42L), result.eventId)
    Assert.assertEquals(CalendarId(3L), result.calendarId)
    Assert.assertEquals(dateToMilliseconds("2026-03-23T10:00:00.000Z"), result.begin)
    Assert.assertEquals(dateToMilliseconds("2026-03-23T11:00:00.000Z"), result.end)
    Assert.assertEquals("Standup", result.description)
    Assert.assertEquals("Room 1", result.eventLocation)
    Assert.assertEquals("Europe/Warsaw", result.eventTimezone)
    Assert.assertEquals("Europe/Warsaw", result.eventEndTimezone)
    Assert.assertEquals("organizer@example.com", result.organizer)
    Assert.assertEquals("Meeting", result.title)
    Assert.assertEquals(false, result.allDay)
    Assert.assertEquals(Availability.BUSY, result.availability)
    Assert.assertEquals(Status.CONFIRMED, result.status)
    Assert.assertEquals(AccessLevel.CONFIDENTIAL, result.accessLevel)
    Assert.assertEquals(false, result.guestsCanModify)
    Assert.assertEquals(true, result.guestsCanInviteOthers)
    Assert.assertEquals(false, result.guestsCanSeeGuests)
    Assert.assertEquals(EventId(12L), result.originalId)
  }

  @Test(expected = IllegalStateException::class)
  fun `given EventRecord Existing without instance id, when toInstanceEntity, then throws IllegalStateException`() {
    // Given
    val record = EventRecord.Existing(
      id = "42",
      startDate = "2026-03-23T10:00:00.000Z",
      endDate = "2026-03-23T11:00:00.000Z",
      calendarId = "3",
      instanceId = null
    )

    // When / Then
    mapper.toInstanceEntity(record)
  }

  @Test
  fun `given EventEntity with nullable booleans, when toInstanceEntity, then maps them to false`() {
    // Given
    val entity = EventEntity(
      id = EventId(5L),
      accessLevel = null,
      allDay = null,
      availability = null,
      calendarId = CalendarId(3L),
      description = null,
      dtEnd = 2_000L,
      dtStart = 1_000L,
      eventEndTimezone = null,
      eventLocation = null,
      eventTimezone = null,
      guestsCanInviteOthers = null,
      guestsCanModify = null,
      guestsCanSeeGuests = null,
      organizer = null,
      originalId = null,
      rrule = null,
      status = null,
      title = "Meeting"
    )

    // When
    val result = mapper.toInstanceEntity(entity)

    // Then
    Assert.assertEquals(false, result.allDay)
    Assert.assertEquals(false, result.guestsCanInviteOthers)
    Assert.assertEquals(false, result.guestsCanModify)
    Assert.assertEquals(false, result.guestsCanSeeGuests)
    Assert.assertEquals(EventId(5L), result.eventId)
    Assert.assertEquals(CalendarId(3L), result.calendarId)
    Assert.assertEquals(1_000L, result.begin)
    Assert.assertEquals(2_000L, result.end)
    Assert.assertEquals("Meeting", result.title)
  }
}
