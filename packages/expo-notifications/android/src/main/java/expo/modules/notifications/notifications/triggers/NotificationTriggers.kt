package expo.modules.notifications.notifications.triggers

import android.os.Bundle
import androidx.core.os.bundleOf
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import kotlinx.parcelize.Parcelize
import java.io.Serializable
import java.util.Calendar
import java.util.Date

@Parcelize
open class ChannelAwareTrigger(open val channelId: String?) :
  NotificationTrigger, Serializable {

  override fun describeContents(): Int = 0

  override fun getNotificationChannel() = channelId

  override fun toBundle() = bundleWithChannelId()

  protected fun bundleWithChannelId(vararg pairs: Pair<String, Any?>): Bundle {
    return bundleOf("channelId" to channelId, *pairs)
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per day.
 */
@Parcelize
class DailyTrigger(override val channelId: String?, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  override fun toBundle() = bundleWithChannelId(
    "type" to "daily",
    "hour" to hour,
    "minute" to minute
  )

  override fun nextTriggerDate(): Date? {
    val nextTriggerDate = Calendar.getInstance()
    nextTriggerDate[Calendar.HOUR_OF_DAY] = hour
    nextTriggerDate[Calendar.MINUTE] = minute
    nextTriggerDate[Calendar.SECOND] = 0
    nextTriggerDate[Calendar.MILLISECOND] = 0
    val rightNow = Calendar.getInstance()
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.DATE, 1)
    }
    return nextTriggerDate.time
  }
}

/**
 * A schedulable trigger representing notification to be scheduled only once at a given moment of time.
 */
@Parcelize
class DateTrigger(override val channelId: String?, val timestamp: Long) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

  override fun toBundle() = bundleWithChannelId(
    "type" to "date",
    "repeats" to false,
    "value" to timestamp
  )

  override fun nextTriggerDate(): Date? {
    val now = Date()
    val triggerDate = Date(timestamp)

    if (triggerDate.before(now)) {
      return null
    }

    return triggerDate
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per month.
 */
@Parcelize
class MonthlyTrigger(override val channelId: String?, val day: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  override fun toBundle() = bundleWithChannelId(
    "type" to "monthly",
    "day" to day,
    "hour" to hour,
    "minute" to minute
  )

  override fun nextTriggerDate(): Date? {
    val nextTriggerDate = Calendar.getInstance()
    nextTriggerDate[Calendar.DATE] = day
    nextTriggerDate[Calendar.HOUR_OF_DAY] = hour
    nextTriggerDate[Calendar.MINUTE] = minute
    nextTriggerDate[Calendar.SECOND] = 0
    nextTriggerDate[Calendar.MILLISECOND] = 0
    val rightNow = Calendar.getInstance()
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.MONTH, 1)
    }
    return nextTriggerDate.time
  }
}

/**
 * A schedulable trigger representing notification to be scheduled after X milliseconds,
 * optionally repeating.
 *
 *
 * *Note: The implementation ensures that the trigger times do not drift away too much from the
 * * initial time, so eg. a trigger started at 11111000 time repeated every 1000 ms should always
 * * trigger around …000 timestamp.*
 */
@Parcelize
class TimeIntervalTrigger(
  override val channelId: String?,
  val timeInterval: Long,
  val isRepeating: Boolean,
  private var triggerDate: Date = Date(System.currentTimeMillis() + timeInterval * 1000)
) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  override fun toBundle() = bundleWithChannelId(
    "type" to "timeInterval",
    "repeats" to isRepeating,
    "seconds" to timeInterval
  )

  override fun nextTriggerDate(): Date? {
    val now = Date()

    if (isRepeating && triggerDate.before(now)) {
      val intervalMillis = timeInterval * 1000
      val elapsedMillis = now.time - triggerDate.time

      val remainingMillis = intervalMillis - (elapsedMillis % intervalMillis)
      triggerDate.time = now.time + remainingMillis
    }

    if (triggerDate.before(now)) {
      return null
    }

    return triggerDate
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per week.
 */
@Parcelize
class WeeklyTrigger(override val channelId: String?, val weekday: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  override fun toBundle() = bundleWithChannelId(
    "type" to "weekly",
    "weekday" to weekday,
    "hour" to hour,
    "minute" to minute
  )

  override fun nextTriggerDate(): Date? {
    val nextTriggerDate = Calendar.getInstance()
    nextTriggerDate[Calendar.DAY_OF_WEEK] = weekday
    nextTriggerDate[Calendar.HOUR_OF_DAY] = hour
    nextTriggerDate[Calendar.MINUTE] = minute
    nextTriggerDate[Calendar.SECOND] = 0
    nextTriggerDate[Calendar.MILLISECOND] = 0
    val rightNow = Calendar.getInstance()
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.DAY_OF_WEEK_IN_MONTH, 1)
    }
    return nextTriggerDate.time
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per year.
 */
@Parcelize
class YearlyTrigger(override val channelId: String?, val day: Int, val month: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  override fun toBundle() = bundleWithChannelId(
    "type" to "yearly",
    "day" to day,
    "month" to month,
    "hour" to hour,
    "minute" to minute
  )

  override fun nextTriggerDate(): Date? {
    val nextTriggerDate = Calendar.getInstance()
    nextTriggerDate[Calendar.DATE] = day
    nextTriggerDate[Calendar.MONTH] = month
    nextTriggerDate[Calendar.HOUR_OF_DAY] = hour
    nextTriggerDate[Calendar.MINUTE] = minute
    nextTriggerDate[Calendar.SECOND] = 0
    nextTriggerDate[Calendar.MILLISECOND] = 0
    val rightNow = Calendar.getInstance()
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.YEAR, 1)
    }
    return nextTriggerDate.time
  }
}
