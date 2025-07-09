package expo.modules.calendar

import expo.modules.core.arguments.ReadableArguments
import io.mockk.every
import io.mockk.mockk
import java.util.TimeZone
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class EventRecurrenceUtilsTest {

  @Before
  fun setUp() {
    TimeZone.setDefault(TimeZone.getTimeZone("GMT"))
  }

  @After
  fun tearDown() {
    TimeZone.setDefault(null)
  }

  @Test
  fun testExtractRecurrence_withAllFields() {
    val mockArgs = mockk<ReadableArguments>(relaxed = true)

    every { mockArgs.getString("frequency") } returns "daily"
    every { mockArgs.getInt("interval") } returns 2
    every { mockArgs.containsKey("interval") } returns true
    every { mockArgs.getInt("occurrence") } returns 10
    every { mockArgs.containsKey("occurrence") } returns true
    every { mockArgs["endDate"] } returns "2024-12-31T00:00:00.000Z"
    every { mockArgs.containsKey("endDate") } returns true

    val result = EventRecurrenceUtils.extractRecurrence(mockArgs)

    assertEquals("daily", result.frequency)
    assertEquals(2, result.interval)
    assertEquals("20241231T000000Z", result.endDate)
    assertEquals(10, result.occurrence)
  }

  @Test
  fun testExtractRecurrence_withMissingOptionalFields() {
    val mockArgs = mockk<ReadableArguments>(relaxed = true)

    every { mockArgs.getString("frequency") } returns "weekly"
    every { mockArgs.containsKey("interval") } returns false
    every { mockArgs.containsKey("occurrence") } returns false
    every { mockArgs.containsKey("endDate") } returns false

    val result = EventRecurrenceUtils.extractRecurrence(mockArgs)

    assertEquals("weekly", result.frequency)
    assertNull(result.interval)
    assertNull(result.endDate)
    assertNull(result.occurrence)
  }

  @Test
  fun testExtractRecurrence_withNullEndDate() {
    val mockArgs = mockk<ReadableArguments>(relaxed = true)

    every { mockArgs.getString("frequency") } returns "yearly"
    every { mockArgs.getInt("interval") } returns 1
    every { mockArgs.containsKey("interval") } returns true
    every { mockArgs["endDate"] } returns null
    every { mockArgs.containsKey("endDate") } returns true

    val result = EventRecurrenceUtils.extractRecurrence(mockArgs)

    assertEquals("yearly", result.frequency)
    assertEquals(1, result.interval)
    assertNull(result.endDate)
    assertNull(result.occurrence)
  }

  @Test
  fun testCreateRecurrenceRule_withAllFields() {
    val opts =
      Recurrence(
        frequency = "daily",
        interval = 1,
        endDate = "20241231T010000Z",
        occurrence = null
      )

    val result = EventRecurrenceUtils.createRecurrenceRule(opts)

    assertEquals("FREQ=DAILY;INTERVAL=1;UNTIL=20241231T010000Z", result)
  }

  @Test
  fun testCreateRecurrenceRule_withOccurrence() {
    val opts = Recurrence(frequency = "weekly", interval = 2, endDate = null, occurrence = 10)

    val result = EventRecurrenceUtils.createRecurrenceRule(opts)

    assertEquals("FREQ=WEEKLY;INTERVAL=2;COUNT=10", result)
  }

  @Test
  fun testCreateRecurrenceRule_withMissingOptionalFields() {
    val opts = Recurrence(frequency = "monthly", interval = null, endDate = null, occurrence = null)

    val result = EventRecurrenceUtils.createRecurrenceRule(opts)

    assertEquals("FREQ=MONTHLY", result)
  }
}
