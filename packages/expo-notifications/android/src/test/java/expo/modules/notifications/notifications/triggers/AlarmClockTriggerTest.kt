package expo.modules.notifications.notifications.triggers

import androidx.test.filters.SmallTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.ObjectStreamClass

@SmallTest
@RunWith(RobolectricTestRunner::class)
class AlarmClockTriggerTest {

  @Test
  fun `alarmClock defaults to false on every wall-clock trigger`() {
    assertFalse(DateTrigger(null, 0L).alarmClock)
    assertFalse(DailyTrigger(null, 1, 2).alarmClock)
    assertFalse(WeeklyTrigger(null, 1, 2, 3).alarmClock)
    assertFalse(MonthlyTrigger(null, 1, 2, 3).alarmClock)
    assertFalse(YearlyTrigger(null, 1, 2, 3, 4).alarmClock)
  }

  @Test
  fun `alarmClock can be enabled on every wall-clock trigger`() {
    assertTrue(DateTrigger(null, 0L, true).alarmClock)
    assertTrue(DailyTrigger(null, 1, 2, true).alarmClock)
    assertTrue(WeeklyTrigger(null, 1, 2, 3, true).alarmClock)
    assertTrue(MonthlyTrigger(null, 1, 2, 3, true).alarmClock)
    assertTrue(YearlyTrigger(null, 1, 2, 3, 4, true).alarmClock)
  }

  @Test
  fun `every wall-clock trigger implements AlarmClockAwareTrigger`() {
    assertTrue(AlarmClockAwareTrigger::class.java.isAssignableFrom(DateTrigger::class.java))
    assertTrue(AlarmClockAwareTrigger::class.java.isAssignableFrom(DailyTrigger::class.java))
    assertTrue(AlarmClockAwareTrigger::class.java.isAssignableFrom(WeeklyTrigger::class.java))
    assertTrue(AlarmClockAwareTrigger::class.java.isAssignableFrom(MonthlyTrigger::class.java))
    assertTrue(AlarmClockAwareTrigger::class.java.isAssignableFrom(YearlyTrigger::class.java))
  }

  @Test
  fun `toBundle carries alarmClock`() {
    assertTrue(DateTrigger(null, 0L, true).toBundle().getBoolean("alarmClock"))
    assertTrue(DailyTrigger(null, 1, 2, true).toBundle().getBoolean("alarmClock"))
    assertTrue(WeeklyTrigger(null, 1, 2, 3, true).toBundle().getBoolean("alarmClock"))
    assertTrue(MonthlyTrigger(null, 1, 2, 3, true).toBundle().getBoolean("alarmClock"))
    assertTrue(YearlyTrigger(null, 1, 2, 3, 4, true).toBundle().getBoolean("alarmClock"))
  }

  @Test
  fun `serialVersionUID is pinned to the pre-alarmClock value`() {
    assertSerialVersionUid(DateTrigger::class.java, -4200735944844450465L)
    assertSerialVersionUid(DailyTrigger::class.java, -6558627774241745821L)
    assertSerialVersionUid(WeeklyTrigger::class.java, 924870175512348775L)
    assertSerialVersionUid(MonthlyTrigger::class.java, 4383170003413342728L)
    assertSerialVersionUid(YearlyTrigger::class.java, -7918055586087594971L)
  }

  private fun assertSerialVersionUid(clazz: Class<*>, expected: Long) {
    assertEquals(
      "serialVersionUID of ${clazz.simpleName} drifted; it must stay pinned so records " +
        "serialized by older library versions keep loading after an update",
      expected,
      ObjectStreamClass.lookup(clazz).serialVersionUID
    )
  }
}
