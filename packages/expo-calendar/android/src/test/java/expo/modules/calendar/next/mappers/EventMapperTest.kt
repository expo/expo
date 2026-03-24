package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventInputRecord
import expo.modules.calendar.next.records.EventUpdateRecord
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.dateToMilliseconds
import expo.modules.kotlin.types.ValueOrUndefined
import org.junit.Assert
import org.junit.Test

class EventMapperTest {
  private val mapper = EventMapper()

  @Test
  fun `given EventRecord New, when toEventInput, then maps fields enums and recurrence`() {
    // Given
    val record = EventInputRecord(
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
    val result = mapper.toEventInput(CalendarId(7L), record)

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
  fun `given EventInputRecord with null fields, when toEventInput, then preserves nulls`() {
    // Given
    val record = EventInputRecord(
      startDate = "2026-03-23T10:00:00.000Z",
      endDate = "2026-03-23T11:00:00.000Z",
      title = "Meeting",
      location = null,
      timeZone = null,
      endTimeZone = null,
      notes = null,
      recurrenceRule = null,
      allDay = null,
      availability = null,
      organizerEmail = null,
      accessLevel = null,
      guestsCanModify = null,
      guestsCanInviteOthers = null,
      guestsCanSeeGuests = null
    )

    // When
    val result = mapper.toEventInput(CalendarId(7L), record)

    // Then
    Assert.assertEquals(CalendarId(7L), result.calendarId)
    Assert.assertEquals("Meeting", result.title)
    Assert.assertNull(result.description)
    Assert.assertEquals(dateToMilliseconds("2026-03-23T10:00:00.000Z"), result.dtStart)
    Assert.assertEquals(dateToMilliseconds("2026-03-23T11:00:00.000Z"), result.dtEnd)
    Assert.assertNull(result.availability)
    Assert.assertNull(result.allDay)
    Assert.assertNull(result.eventLocation)
    Assert.assertNull(result.organizer)
    Assert.assertNull(result.guestsCanModify)
    Assert.assertNull(result.guestsCanInviteOthers)
    Assert.assertNull(result.guestsCanSeeGuests)
    Assert.assertNull(result.eventTimezone)
    Assert.assertNull(result.eventEndTimezone)
    Assert.assertNull(result.accessLevel)
    Assert.assertNull(result.rrule)
  }

  @Test(expected = IllegalArgumentException::class)
  fun `given recurrence rule without frequency, when toEventInput, then throws IllegalArgumentException`() {
    // Given
    val record = EventInputRecord(
      startDate = "2026-03-23T10:00:00.000Z",
      endDate = "2026-03-23T11:00:00.000Z",
      title = "Meeting",
      recurrenceRule = RecurrenceRuleRecord(
        frequency = null,
        interval = 1,
        occurrence = null,
        endDate = null
      )
    )

    // When / Then
    mapper.toEventInput(CalendarId(7L), record)
  }

  @Test
  fun `given EventUpdateRecord with defined fields, when toEventUpdate, then maps update fields`() {
    // Given
    val record = EventUpdateRecord(
      title = ValueOrUndefined.Value("Updated"),
      startDate = ValueOrUndefined.Value("2026-03-24T10:00:00.000Z"),
      endDate = ValueOrUndefined.Value("2026-03-24T11:00:00.000Z"),
      location = ValueOrUndefined.Value("Room 1"),
      timeZone = ValueOrUndefined.Value("Europe/Warsaw"),
      endTimeZone = ValueOrUndefined.Value("Europe/Warsaw"),
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
      organizerEmail = ValueOrUndefined.Value("organizer@example.com"),
      accessLevel = ValueOrUndefined.Value(EventAccessLevel.PRIVATE),
      guestsCanModify = ValueOrUndefined.Value(true),
      guestsCanInviteOthers = ValueOrUndefined.Value(false),
      guestsCanSeeGuests = ValueOrUndefined.Value(true)
    )

    // When
    val result = mapper.toEventUpdate(record)

    // Then
    Assert.assertEquals("Updated", result.title.optional)
    Assert.assertEquals(dateToMilliseconds("2026-03-24T10:00:00.000Z"), result.dtStart.optional)
    Assert.assertEquals(dateToMilliseconds("2026-03-24T11:00:00.000Z"), result.dtEnd.optional)
    Assert.assertEquals("Room 1", result.eventLocation.optional)
    Assert.assertEquals("Europe/Warsaw", result.eventTimezone.optional)
    Assert.assertEquals("Europe/Warsaw", result.eventEndTimezone.optional)
    Assert.assertEquals("Updated notes", result.description.optional)
    Assert.assertEquals(false, result.allDay.optional)
    Assert.assertEquals(Availability.TENTATIVE, result.availability.optional)
    Assert.assertEquals("organizer@example.com", result.organizer.optional)
    Assert.assertEquals(AccessLevel.PRIVATE, result.accessLevel.optional)
    Assert.assertEquals(true, result.guestsCanModify.optional)
    Assert.assertEquals(false, result.guestsCanInviteOthers.optional)
    Assert.assertEquals(true, result.guestsCanSeeGuests.optional)
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
  fun `given EventUpdateRecord with null fields, when toEventUpdate, then preserves explicit nulls`() {
    // Given
    val record = EventUpdateRecord(
      title = ValueOrUndefined.Value(null),
      startDate = ValueOrUndefined.Value(null),
      endDate = ValueOrUndefined.Value(null),
      location = ValueOrUndefined.Value(null),
      timeZone = ValueOrUndefined.Value(null),
      endTimeZone = ValueOrUndefined.Value(null),
      notes = ValueOrUndefined.Value(null),
      recurrenceRule = ValueOrUndefined.Value(null),
      allDay = ValueOrUndefined.Value(null),
      availability = ValueOrUndefined.Value(null),
      organizerEmail = ValueOrUndefined.Value(null),
      accessLevel = ValueOrUndefined.Value(null),
      guestsCanModify = ValueOrUndefined.Value(null),
      guestsCanInviteOthers = ValueOrUndefined.Value(null),
      guestsCanSeeGuests = ValueOrUndefined.Value(null)
    )

    // When
    val result = mapper.toEventUpdate(record)

    // Then
    Assert.assertNull(result.title.optional)
    Assert.assertNull(result.dtStart.optional)
    Assert.assertNull(result.dtEnd.optional)
    Assert.assertNull(result.eventLocation.optional)
    Assert.assertNull(result.eventTimezone.optional)
    Assert.assertNull(result.eventEndTimezone.optional)
    Assert.assertNull(result.description.optional)
    Assert.assertNull(result.rrule.optional)
    Assert.assertNull(result.allDay.optional)
    Assert.assertNull(result.availability.optional)
    Assert.assertNull(result.organizer.optional)
    Assert.assertNull(result.accessLevel.optional)
    Assert.assertNull(result.guestsCanModify.optional)
    Assert.assertNull(result.guestsCanInviteOthers.optional)
    Assert.assertNull(result.guestsCanSeeGuests.optional)
  }

  @Test
  fun `given EventUpdateRecord with undefined fields, when toEventUpdate, then preserves undefineds`() {
    // Given
    val record = EventUpdateRecord()

    // When
    val result = mapper.toEventUpdate(record)

    // Then
    Assert.assertTrue(result.title.isUndefined)
    Assert.assertTrue(result.dtStart.isUndefined)
    Assert.assertTrue(result.dtEnd.isUndefined)
    Assert.assertTrue(result.eventLocation.isUndefined)
    Assert.assertTrue(result.eventTimezone.isUndefined)
    Assert.assertTrue(result.eventEndTimezone.isUndefined)
    Assert.assertTrue(result.description.isUndefined)
    Assert.assertTrue(result.rrule.isUndefined)
    Assert.assertTrue(result.allDay.isUndefined)
    Assert.assertTrue(result.availability.isUndefined)
    Assert.assertTrue(result.organizer.isUndefined)
    Assert.assertTrue(result.accessLevel.isUndefined)
    Assert.assertTrue(result.guestsCanModify.isUndefined)
    Assert.assertTrue(result.guestsCanInviteOthers.isUndefined)
    Assert.assertTrue(result.guestsCanSeeGuests.isUndefined)
  }
}
