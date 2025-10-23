package expo.modules.calendar

import expo.modules.calendar.domain.event.records.RecurrenceRuleEntity
import expo.modules.calendar.domain.event.records.input.RecurrenceRuleInput
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.types.ConvertedValue
import expo.modules.kotlin.types.Either
import expo.modules.kotlin.types.IncompatibleValue
import java.util.TimeZone
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import kotlin.reflect.typeOf

class EventRecurrenceUtilsTest {

  @Before
  fun setUp() {
    TimeZone.setDefault(TimeZone.getTimeZone("GMT"))
  }

  @After
  fun tearDown() {
    TimeZone.setDefault(null)
  }

  @OptIn(EitherType::class)
  @Test
  fun testCreateRecurrenceRule_withAllFields() {
    val opts =
      RecurrenceRuleInput(
        frequency = "daily",
        interval = 1,
        endDate = eitherWithFirst<String, Long>("2024-12-31T01:00:00.000Z"),
        occurrence = null
      )

    val result = opts.toRuleString()

    assertEquals("FREQ=DAILY;INTERVAL=1;UNTIL=20241231T010000Z", result)
  }

  @Test
  fun testCreateRecurrenceRule_withOccurrence() {
    val opts = RecurrenceRuleInput(frequency = "weekly", interval = 2, occurrence = 10)

    val result = opts.toRuleString()

    assertEquals("FREQ=WEEKLY;INTERVAL=2;COUNT=10", result)
  }

  @Test
  fun testCreateRecurrenceRule_withMissingOptionalFields() {
    val opts = RecurrenceRuleInput(frequency = "monthly", interval = null, occurrence = null)

    val result = opts.toRuleString()

    assertEquals("FREQ=MONTHLY", result)
  }

  @Test
  fun testParseRecurrenceRule_withAllFields() {
    val rrule = "FREQ=DAILY;INTERVAL=1;UNTIL=20241231T010000Z"

    val recurrence = RecurrenceRuleEntity.fromRuleString(rrule)

    assertEquals(recurrence.frequency, "daily")
    assertEquals(recurrence.interval, 1)
    assertEquals(recurrence.endDate, "2024-12-31T01:00:00.000Z")
    assertEquals(recurrence.occurrence, null)
  }

  @Test
  fun testParseRecurrenceRule_withOccurrence() {
    val rrule = "FREQ=WEEKLY;INTERVAL=2;COUNT=10"

    val recurrence = RecurrenceRuleEntity.fromRuleString(rrule)

    assertEquals(recurrence.frequency, "weekly")
    assertEquals(recurrence.interval, 2)
    assertEquals(recurrence.endDate, null)
    assertEquals(recurrence.occurrence, 10)
  }

  @Test
  fun testParseRecurrenceRule_withMissingOptionalFields() {
    val rrule = "FREQ=MONTHLY"

    val recurrence = RecurrenceRuleEntity.fromRuleString(rrule)

    assertEquals(recurrence.frequency, "monthly")
    assertEquals(recurrence.interval, null)
    assertEquals(recurrence.endDate, null)
    assertEquals(recurrence.occurrence, null)
  }

  @Test
  fun testParseRecurrenceRule_withAllDayDate() {
    val rrule = "FREQ=DAILY;INTERVAL=1;UNTIL=20251024"

    val recurrence = RecurrenceRuleEntity.fromRuleString(rrule)

    assertEquals(recurrence.frequency, "daily")
    assertEquals(recurrence.interval, 1)
    assertEquals(recurrence.endDate, "2025-10-24T00:00:00.000Z")
    assertEquals(recurrence.occurrence, null)
  }

  @Test
  fun testParseRecurrenceRule_withCustomOrderAndUnknownFields() {
    val rrule = "FREQ=DAILY;UNTIL=20251024;INTERVAL=1;WKST=SU"

    val recurrence = RecurrenceRuleEntity.fromRuleString(rrule)

    assertEquals(recurrence.frequency, "daily")
    assertEquals(recurrence.interval, 1)
    assertEquals(recurrence.endDate, "2025-10-24T00:00:00.000Z")
    assertEquals(recurrence.occurrence, null)
  }
}

@OptIn(EitherType::class)
private inline fun <reified L : Any, reified R : Any> eitherWithFirst(value: L): Either<L, R> {
  val types = listOf(typeOf<L>(), typeOf<R>())

  val deferredValue = mutableListOf(
    ConvertedValue(value),
    IncompatibleValue
  )

  return Either(value, deferredValue, types)
}
