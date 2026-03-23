package expo.modules.calendar.next.mappers

import expo.modules.calendar.next.domain.model.event.AccessLevel
import expo.modules.calendar.next.domain.model.event.Availability
import expo.modules.calendar.next.domain.model.event.RecurrenceRule
import expo.modules.calendar.next.domain.model.event.Status
import expo.modules.calendar.next.domain.model.instance.InstanceEntity
import expo.modules.calendar.next.domain.model.reminder.Method
import expo.modules.calendar.next.domain.model.reminder.ReminderEntity
import expo.modules.calendar.next.domain.wrappers.CalendarId
import expo.modules.calendar.next.domain.wrappers.EventId
import expo.modules.calendar.next.domain.wrappers.ReminderId
import expo.modules.calendar.next.records.AlarmMethod
import expo.modules.calendar.next.records.EventAccessLevel
import expo.modules.calendar.next.records.EventAvailability
import expo.modules.calendar.next.records.EventStatus
import expo.modules.calendar.next.records.RecurrenceRuleRecord
import expo.modules.calendar.next.utils.sdf
import org.junit.Assert
import org.junit.Test

class ExpoCalendarEventMapperTest {
  private val mapper = ExpoCalendarEventMapper(ReminderMapper())

  @Test
  fun `given InstanceEntity with reminders, when toData, then maps dates alarms recurrence and enums`() {
    // Given
    val instanceEntity = InstanceEntity(
      accessLevel = AccessLevel.PUBLIC,
      allDay = false,
      availability = Availability.FREE,
      begin = 1_000_000L,
      calendarId = CalendarId(3L),
      description = "Standup",
      end = 2_000_000L,
      eventEndTimezone = "Europe/Warsaw",
      eventId = EventId(42L),
      eventLocation = "Room 1",
      eventTimezone = "Europe/Warsaw",
      id = 99L,
      guestsCanInviteOthers = true,
      guestsCanModify = false,
      guestsCanSeeGuests = true,
      organizer = "organizer@example.com",
      originalId = EventId(12L),
      rrule = RecurrenceRule(
        frequency = "weekly",
        interval = 1,
        occurrence = null,
        endDate = "2026-03-31T10:00:00.000Z"
      ),
      status = Status.CONFIRMED,
      title = "Meeting"
    )
    val reminders = listOf(
      ReminderEntity(
        id = ReminderId(1L),
        eventId = EventId(42L),
        method = Method.EMAIL,
        minutes = 15
      )
    )

    // When
    val result = mapper.toData(instanceEntity, reminders)

    // Then
    Assert.assertEquals("42", result.id)
    Assert.assertEquals("3", result.calendarId)
    Assert.assertEquals("Meeting", result.title)
    Assert.assertEquals("Standup", result.notes)
    Assert.assertEquals(sdf.format(1_000_000L), result.startDate)
    Assert.assertEquals(sdf.format(2_000_000L), result.endDate)
    Assert.assertEquals(false, result.allDay)
    Assert.assertEquals("Room 1", result.location)
    Assert.assertEquals("Europe/Warsaw", result.timeZone)
    Assert.assertEquals("Europe/Warsaw", result.endTimeZone)
    Assert.assertEquals(EventAvailability.FREE, result.availability)
    Assert.assertEquals("organizer@example.com", result.organizerEmail)
    Assert.assertEquals(EventAccessLevel.PUBLIC, result.accessLevel)
    Assert.assertEquals(true, result.guestsCanInviteOthers)
    Assert.assertEquals(false, result.guestsCanModify)
    Assert.assertEquals(true, result.guestsCanSeeGuests)
    Assert.assertEquals(EventStatus.CONFIRMED, result.status)
    Assert.assertEquals("12", result.originalId)
    Assert.assertEquals(99L, result.instanceId)
    Assert.assertEquals(
      RecurrenceRuleRecord(
        endDate = "2026-03-31T10:00:00.000Z",
        frequency = "weekly",
        interval = 1,
        occurrence = null
      ),
      result.recurrenceRule
    )
    Assert.assertEquals(1, result.alarms.size)
    Assert.assertEquals(15, result.alarms[0].relativeOffset)
    Assert.assertEquals(AlarmMethod.EMAIL, result.alarms[0].method)
  }

  @Test
  fun `given minimal InstanceEntity, when toData, then preserves nulls and empty reminders`() {
    // Given
    val instanceEntity = InstanceEntity(
      accessLevel = null,
      allDay = false,
      availability = null,
      begin = 1_000L,
      calendarId = null,
      description = null,
      end = 2_000L,
      eventEndTimezone = null,
      eventId = EventId(7L),
      eventLocation = null,
      eventTimezone = null,
      id = 0L,
      guestsCanInviteOthers = false,
      guestsCanModify = false,
      guestsCanSeeGuests = false,
      organizer = null,
      originalId = null,
      rrule = null,
      status = null,
      title = null
    )

    // When
    val result = mapper.toData(instanceEntity)

    // Then
    Assert.assertEquals("7", result.id)
    Assert.assertTrue(result.alarms.isEmpty())
    Assert.assertNull(result.calendarId)
    Assert.assertNull(result.title)
    Assert.assertNull(result.notes)
    Assert.assertNull(result.location)
    Assert.assertNull(result.timeZone)
    Assert.assertNull(result.endTimeZone)
    Assert.assertNull(result.availability)
    Assert.assertNull(result.organizerEmail)
    Assert.assertNull(result.accessLevel)
    Assert.assertEquals(false, result.guestsCanInviteOthers)
    Assert.assertEquals(false, result.guestsCanModify)
    Assert.assertEquals(false, result.guestsCanSeeGuests)
    Assert.assertNull(result.originalId)
    Assert.assertEquals(0L, result.instanceId)
    Assert.assertNull(result.recurrenceRule)
    Assert.assertNull(result.status)
  }
}
