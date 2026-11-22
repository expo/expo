package expo.modules.calendar.next.domain.model.event

import org.junit.Assert.assertEquals
import org.junit.Test

class RecurrenceSelectorsTest {
  @Test
  fun weeklySelectorsSurviveRoundTrip() {
    val rrule = "FREQ=WEEKLY;INTERVAL=2;COUNT=4;BYDAY=SU,MO,TU,WE,TH,FR,SA"
    assertEquals(rrule, RecurrenceRule.fromRuleString(rrule).toRuleString())
  }

  @Test
  fun ordinalWeekdaysAndCalendarDatesSurviveRoundTrip() {
    val rrule = "FREQ=YEARLY;BYDAY=-1FR;BYMONTHDAY=-1,29;BYMONTH=2,11"
    assertEquals(rrule, RecurrenceRule.fromRuleString(rrule).toRuleString())
  }
}
