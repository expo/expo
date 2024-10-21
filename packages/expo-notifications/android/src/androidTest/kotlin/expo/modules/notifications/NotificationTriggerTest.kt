package expo.modules.notifications

import android.os.Parcel
import android.os.Bundle
import androidx.test.filters.SmallTest
import expo.modules.notifications.notifications.triggers.DailyTrigger
import expo.modules.notifications.notifications.triggers.DateTrigger
import expo.modules.notifications.notifications.triggers.MonthlyTrigger
import expo.modules.notifications.notifications.triggers.TimeIntervalTrigger
import expo.modules.notifications.notifications.triggers.WeeklyTrigger
import expo.modules.notifications.notifications.triggers.YearlyTrigger
import kotlinx.parcelize.parcelableCreator
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test
import java.util.Calendar

@SmallTest
class NotificationTriggerTest {
  private var calendarNow: Calendar = Calendar.getInstance()
  private var calendar5MinutesFromNow: Calendar = Calendar.getInstance().apply {
    add(Calendar.MINUTE, 5)
  }

  @Test
  fun testDateTrigger() {
    val date5MinutesFromNow = calendar5MinutesFromNow.time
    val dateTrigger = DateTrigger(null, date5MinutesFromNow.time)
    val nextTriggerDate = dateTrigger.nextTriggerDate()
    assertEquals(/* expected = */ calendarNow.get(Calendar.MINUTE) + 5, /* actual = */ nextTriggerDate?.minutes)
    assertEquals(/* expected = */ calendarNow.get(Calendar.SECOND), /* actual = */ nextTriggerDate?.seconds)
    assertNull(dateTrigger.channelId)

    val dateTriggerWithChannel = DateTrigger("myChannel", date5MinutesFromNow.time)
    assertEquals(/* expected = */ "myChannel", /* actual = */ dateTriggerWithChannel.channelId)
  }

  @Test
  fun testTimeIntervalTrigger() {
    val timeIntervalTrigger = TimeIntervalTrigger(null, 2, true)
    val nextTriggerDate = timeIntervalTrigger.nextTriggerDate()
    assertEquals(/* expected = */ calendarNow.get(Calendar.SECOND) + 2, /* actual = */ nextTriggerDate!!.seconds)
    assertTrue(/* condition = */ timeIntervalTrigger.isRepeating)

    val timeIntervalTriggerWithChannel = TimeIntervalTrigger("myChannel", 5, false)
    assertEquals("myChannel", timeIntervalTriggerWithChannel.channelId)
    assertFalse(/* condition = */ timeIntervalTriggerWithChannel.isRepeating)
  }

  @Test
  fun testDailyTrigger() {
    val dailyTrigger = DailyTrigger(null, 9, 15)
    val nextTriggerDateCalendar = Calendar.getInstance()
    nextTriggerDateCalendar.time = dailyTrigger.nextTriggerDate()!!
    assertEquals(9, nextTriggerDateCalendar.get(Calendar.HOUR_OF_DAY))
    assertTrue(nextTriggerDateCalendar.after(calendarNow))
  }

  @Test
  fun testWeeklyTrigger() {
    val weeklyTrigger = WeeklyTrigger(null, 4, 9, 15)
    val nextTriggerDateCalendar = Calendar.getInstance()
    nextTriggerDateCalendar.time = weeklyTrigger.nextTriggerDate()!!
    assertEquals(9, nextTriggerDateCalendar.get(Calendar.HOUR_OF_DAY))
    assertEquals(4, nextTriggerDateCalendar.get(Calendar.DAY_OF_WEEK))
    assertTrue(nextTriggerDateCalendar.after(calendarNow))
  }

  @Test
  fun testMonthlyTrigger() {
    val monthlyTrigger = MonthlyTrigger("myChannel", 15, 9, 15)
    val nextTriggerDateCalendar = Calendar.getInstance()
    nextTriggerDateCalendar.time = monthlyTrigger.nextTriggerDate()!!
    assertEquals(15, nextTriggerDateCalendar.get(Calendar.DAY_OF_MONTH))
    assertTrue(nextTriggerDateCalendar.after(calendarNow))
  }

  @Test
  fun testYearlyTrigger() {
    val yearlyTrigger = YearlyTrigger(null, 15, 4, 9, 15)
    val nextTriggerDateCalendar = Calendar.getInstance()
    nextTriggerDateCalendar.time = yearlyTrigger.nextTriggerDate()!!
    assertEquals(15, nextTriggerDateCalendar.get(Calendar.DAY_OF_MONTH))
    assertEquals(4, nextTriggerDateCalendar.get(Calendar.MONTH))
    assertTrue(nextTriggerDateCalendar.after(calendarNow))
  }

  @Test
  fun testDateTriggerParcel() {
    // Date trigger
    val dateTrigger = DateTrigger("myChannel", calendar5MinutesFromNow.time.time)
    val parcel = Parcel.obtain()
    dateTrigger.writeToParcel(parcel, 0)
    parcel.setDataPosition(0)
    val dateTriggerFromParcel = parcelableCreator<DateTrigger>().createFromParcel(parcel)
    assertEquals(dateTrigger.channelId, dateTriggerFromParcel.channelId)
    assertEquals(dateTrigger.timestamp, dateTriggerFromParcel.timestamp)
    assertEquals(calendar5MinutesFromNow.time.time, dateTriggerFromParcel.timestamp)
  }

  @Test
  fun testTimeIntervalTriggerParcel() {
    // Time interval trigger
    val timeIntervalTrigger = TimeIntervalTrigger(null, 2, false)
    val parcel = Parcel.obtain()
    timeIntervalTrigger.writeToParcel(parcel, 0)
    parcel.setDataPosition(0)
    val timeIntervalTriggerFromParcel = parcelableCreator<TimeIntervalTrigger>().createFromParcel(parcel)
    assertNull(timeIntervalTriggerFromParcel.channelId)
    assertFalse(timeIntervalTriggerFromParcel.isRepeating)
    assertEquals(timeIntervalTriggerFromParcel.timeInterval, 2)
  }

  @Test
  fun testDateTriggerToBundle() {
    val dateTrigger = DateTrigger("myChannel", calendar5MinutesFromNow.time.time)
    val bundle = dateTrigger.toBundle()
    assertBundleEquals(
      mapOf(
        "type" to "date",
        "channelId" to "myChannel",
        "value" to calendar5MinutesFromNow.time.time
      ),
      bundle
    )
  }

  @Test
  fun testTimeIntervalTriggerToBundle() {
    val timeIntervalTrigger = TimeIntervalTrigger("myChannel", 300, true)
    val bundle = timeIntervalTrigger.toBundle()
    assertBundleEquals(
      mapOf(
        "type" to "timeInterval",
        "channelId" to "myChannel",
        "seconds" to 300L,
        "repeats" to true
      ),
      bundle
    )
  }

  @Test
  fun testDailyTriggerToBundle() {
    val dailyTrigger = DailyTrigger("myChannel", 14, 30)
    val bundle = dailyTrigger.toBundle()
    assertBundleEquals(
      mapOf(
        "type" to "daily",
        "channelId" to "myChannel",
        "hour" to 14,
        "minute" to 30
      ),
      bundle
    )
  }

  @Test
  fun testWeeklyTriggerToBundle() {
    val weeklyTrigger = WeeklyTrigger("myChannel", Calendar.MONDAY, 9, 11)
    val bundle = weeklyTrigger.toBundle()
    assertBundleEquals(
      mapOf(
        "type" to "weekly",
        "channelId" to "myChannel",
        "weekday" to Calendar.MONDAY,
        "hour" to 9,
        "minute" to 11
      ),
      bundle
    )
  }

  @Test
  fun testMonthlyTriggerToBundle() {
    val monthlyTrigger = MonthlyTrigger("myChannel", 15, 12, 0)
    val bundle = monthlyTrigger.toBundle()
    assertBundleEquals(
      mapOf(
        "type" to "monthly",
        "channelId" to "myChannel",
        "day" to 15,
        "hour" to 12,
        "minute" to 0
      ),
      bundle
    )
  }

  @Test
  fun testYearlyTriggerToBundle() {
    val yearlyTrigger = YearlyTrigger("myChannel", 1, 0, 2, 3)
    val bundle = yearlyTrigger.toBundle()
    assertBundleEquals(
      mapOf(
        "type" to "yearly",
        "channelId" to "myChannel",
        "day" to 1,
        "month" to 0,
        "hour" to 2,
        "minute" to 3
      ),
      bundle
    )
  }

  private fun assertBundleEquals(expected: Map<String, Any>, actual: Bundle) {
    for ((key, value) in expected) {
      when (value) {
        is String -> assertEquals(value, actual.getString(key))
        is Int -> assertEquals(value, actual.getInt(key))
        is Long -> assertEquals(value, actual.getLong(key))
        is Boolean -> assertEquals(value, actual.getBoolean(key))
        else -> fail("Unsupported type for key $key")
      }
    }
  }
}
