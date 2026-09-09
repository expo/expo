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
 * A schedulable trigger that can opt into `AlarmManager.setAlarmClock()` delivery.
 * JS exposes the choice as `delivery: 'bestEffort' | 'alarmClock'`.
 */
interface AlarmClockAwareTrigger {
  val alarmClock: Boolean

  val delivery: String
    get() = if (alarmClock) DELIVERY_ALARM_CLOCK else DELIVERY_BEST_EFFORT

  companion object {
    const val DELIVERY_BEST_EFFORT = "bestEffort"
    const val DELIVERY_ALARM_CLOCK = "alarmClock"
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per day.
 */
@Parcelize
class DailyTrigger(override val channelId: String?, val hour: Int, val minute: Int, override val alarmClock: Boolean = false) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger, AlarmClockAwareTrigger {

  companion object {
    // Pinned to the value computed for the pre-alarmClock class shape so records serialized
    // by older versions of the library keep loading (they deserialize with alarmClock = false).
    private const val serialVersionUID: Long = -6558627774241745821L
  }

  override fun toBundle() = bundleWithChannelId(
    "type" to "daily",
    "hour" to hour,
    "minute" to minute,
    "delivery" to delivery
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
class DateTrigger(
  override val channelId: String?,
  val timestamp: Long,
  override val alarmClock: Boolean = false
) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger, AlarmClockAwareTrigger {

  companion object {
    // Pinned to the value computed for the pre-alarmClock class shape so records serialized
    // by older versions of the library keep loading (they deserialize with alarmClock = false).
    private const val serialVersionUID: Long = -4200735944844450465L
  }

  override fun toBundle() = bundleWithChannelId(
    "type" to "date",
    "repeats" to false,
    "value" to timestamp,
    "delivery" to delivery
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
class MonthlyTrigger(override val channelId: String?, val day: Int, val hour: Int, val minute: Int, override val alarmClock: Boolean = false) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger, AlarmClockAwareTrigger {

  companion object {
    // Pinned to the value computed for the pre-alarmClock class shape so records serialized
    // by older versions of the library keep loading (they deserialize with alarmClock = false).
    private const val serialVersionUID: Long = 4383170003413342728L
  }

  override fun toBundle() = bundleWithChannelId(
    "type" to "monthly",
    "day" to day,
    "hour" to hour,
    "minute" to minute,
    "delivery" to delivery
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
class WeeklyTrigger(override val channelId: String?, val weekday: Int, val hour: Int, val minute: Int, override val alarmClock: Boolean = false) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger, AlarmClockAwareTrigger {

  companion object {
    // Pinned to the value computed for the pre-alarmClock class shape so records serialized
    // by older versions of the library keep loading (they deserialize with alarmClock = false).
    private const val serialVersionUID: Long = 924870175512348775L
  }

  override fun toBundle() = bundleWithChannelId(
    "type" to "weekly",
    "weekday" to weekday,
    "hour" to hour,
    "minute" to minute,
    "delivery" to delivery
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
class YearlyTrigger(override val channelId: String?, val day: Int, val month: Int, val hour: Int, val minute: Int, override val alarmClock: Boolean = false) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger, AlarmClockAwareTrigger {

  companion object {
    // Pinned to the value computed for the pre-alarmClock class shape so records serialized
    // by older versions of the library keep loading (they deserialize with alarmClock = false).
    private const val serialVersionUID: Long = -7918055586087594971L
  }

  override fun toBundle() = bundleWithChannelId(
    "type" to "yearly",
    "day" to day,
    "month" to month,
    "hour" to hour,
    "minute" to minute,
    "delivery" to delivery
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
