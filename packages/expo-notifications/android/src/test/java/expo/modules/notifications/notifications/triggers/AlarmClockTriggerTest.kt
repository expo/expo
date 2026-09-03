package expo.modules.notifications.notifications.triggers

import androidx.test.filters.SmallTest
import expo.modules.notifications.service.delegates.asBase64EncodedObject
import expo.modules.notifications.service.delegates.encodedInBase64
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@SmallTest
@RunWith(RobolectricTestRunner::class)
class AlarmClockTriggerTest {

  @Test
  fun `toBundle carries alarmClock`() {
    assertTrue(DateTrigger(null, 0L, true).toBundle().getBoolean("alarmClock"))
    assertTrue(DailyTrigger(null, 1, 2, true).toBundle().getBoolean("alarmClock"))
    assertTrue(WeeklyTrigger(null, 1, 2, 3, true).toBundle().getBoolean("alarmClock"))
    assertTrue(MonthlyTrigger(null, 1, 2, 3, true).toBundle().getBoolean("alarmClock"))
    assertTrue(YearlyTrigger(null, 1, 2, 3, 4, true).toBundle().getBoolean("alarmClock"))
    assertFalse(DateTrigger(null, 0L).toBundle().getBoolean("alarmClock"))
  }

  @Test
  fun `alarmClock survives a serialization round trip`() {
    val trigger = DateTrigger("chan", 1L, true).encodedInBase64().asBase64EncodedObject<DateTrigger>()
    assertTrue(trigger.alarmClock)
  }

  // Records persisted by the library before `alarmClock` existed. Produced on main by
  // `trigger.encodedInBase64()`, the same path SharedPreferencesNotificationsStore uses.
  @Test
  fun `triggers serialized before alarmClock existed still load`() {
    val date = PRE_ALARM_CLOCK_DATE.asBase64EncodedObject<DateTrigger>()
    assertEquals("chan", date.channelId)
    assertEquals(1_728_000_000_000L, date.timestamp)
    assertFalse(date.alarmClock)

    val daily = PRE_ALARM_CLOCK_DAILY.asBase64EncodedObject<DailyTrigger>()
    assertEquals(9, daily.hour)
    assertEquals(15, daily.minute)
    assertFalse(daily.alarmClock)

    val weekly = PRE_ALARM_CLOCK_WEEKLY.asBase64EncodedObject<WeeklyTrigger>()
    assertEquals(4, weekly.weekday)
    assertFalse(weekly.alarmClock)

    val monthly = PRE_ALARM_CLOCK_MONTHLY.asBase64EncodedObject<MonthlyTrigger>()
    assertEquals(15, monthly.day)
    assertFalse(monthly.alarmClock)

    val yearly = PRE_ALARM_CLOCK_YEARLY.asBase64EncodedObject<YearlyTrigger>()
    assertEquals(4, yearly.month)
    assertFalse(yearly.alarmClock)
  }

  companion object {
    private const val PRE_ALARM_CLOCK_DATE =
      "rO0ABXNyAD1leHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLkRhdGVUcmlnZ2VyxbP86iRU5V8CAAJKAAl0aW1lc3RhbXBMAAljaGFubmVsSWR0ABJMamF2YS9sYW5nL1N0cmluZzt4cgBFZXhwby5tb2R1bGVzLm5vdGlmaWNhdGlvbnMubm90aWZpY2F0aW9ucy50cmlnZ2Vycy5DaGFubmVsQXdhcmVUcmlnZ2VyxcsrywNUXkoCAAFMAAljaGFubmVsSWRxAH4AAXhwdAAEY2hhbgAAAZJU04AAcQB+AAQ="
    private const val PRE_ALARM_CLOCK_DAILY =
      "rO0ABXNyAD5leHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLkRhaWx5VHJpZ2dlcqT7EsnWT1RjAgADSQAEaG91ckkABm1pbnV0ZUwACWNoYW5uZWxJZHQAEkxqYXZhL2xhbmcvU3RyaW5nO3hyAEVleHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLkNoYW5uZWxBd2FyZVRyaWdnZXLFyyvLA1ReSgIAAUwACWNoYW5uZWxJZHEAfgABeHB0AARjaGFuAAAACQAAAA9xAH4ABA=="
    private const val PRE_ALARM_CLOCK_WEEKLY =
      "rO0ABXNyAD9leHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLldlZWtseVRyaWdnZXIM1cyGQsRIZwIABEkABGhvdXJJAAZtaW51dGVJAAd3ZWVrZGF5TAAJY2hhbm5lbElkdAASTGphdmEvbGFuZy9TdHJpbmc7eHIARWV4cG8ubW9kdWxlcy5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMudHJpZ2dlcnMuQ2hhbm5lbEF3YXJlVHJpZ2dlcsXLK8sDVF5KAgABTAAJY2hhbm5lbElkcQB+AAF4cHQABGNoYW4AAAAJAAAADwAAAARxAH4ABA=="
    private const val PRE_ALARM_CLOCK_MONTHLY =
      "rO0ABXNyAEBleHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLk1vbnRobHlUcmlnZ2VyPNQl5SOZmggCAARJAANkYXlJAARob3VySQAGbWludXRlTAAJY2hhbm5lbElkdAASTGphdmEvbGFuZy9TdHJpbmc7eHIARWV4cG8ubW9kdWxlcy5ub3RpZmljYXRpb25zLm5vdGlmaWNhdGlvbnMudHJpZ2dlcnMuQ2hhbm5lbEF3YXJlVHJpZ2dlcsXLK8sDVF5KAgABTAAJY2hhbm5lbElkcQB+AAF4cHQABGNoYW4AAAAPAAAACQAAAA9xAH4ABA=="
    private const val PRE_ALARM_CLOCK_YEARLY =
      "rO0ABXNyAD9leHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLlllYXJseVRyaWdnZXKSHWplZ3OUJQIABUkAA2RheUkABGhvdXJJAAZtaW51dGVJAAVtb250aEwACWNoYW5uZWxJZHQAEkxqYXZhL2xhbmcvU3RyaW5nO3hyAEVleHBvLm1vZHVsZXMubm90aWZpY2F0aW9ucy5ub3RpZmljYXRpb25zLnRyaWdnZXJzLkNoYW5uZWxBd2FyZVRyaWdnZXLFyyvLA1ReSgIAAUwACWNoYW5uZWxJZHEAfgABeHB0AARjaGFuAAAADwAAAAkAAAAPAAAABHEAfgAE"
  }
}
