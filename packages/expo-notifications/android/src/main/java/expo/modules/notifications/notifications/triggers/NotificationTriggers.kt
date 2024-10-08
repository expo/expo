package expo.modules.notifications.notifications.triggers

import android.os.Parcel
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import kotlinx.parcelize.IgnoredOnParcel
import kotlinx.parcelize.Parceler
import kotlinx.parcelize.Parcelize
import java.io.Serializable
import java.util.Calendar
import java.util.Date

@Parcelize
open class ChannelAwareTrigger(open val channelId: String?) :
  NotificationTrigger, Serializable {

  override fun describeContents(): Int = 0

  override fun getNotificationChannel(): String? {
    return channelId
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per day.
 */
@Parcelize
class DailyTrigger(override val channelId: String?, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

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
  val triggerDate = Date(timestamp)

  constructor(parcel: Parcel) : this(parcel.readString(), parcel.readLong())

  override fun nextTriggerDate(): Date? {
    val now = Date()

    if (triggerDate.before(now)) {
      return null
    }

    return triggerDate
  }

  companion object : Parceler<DateTrigger> {
    override fun DateTrigger.write(parcel: Parcel, flags: Int) {
      parcel.writeString(channelId)
      parcel.writeLong(triggerDate.time)
    }

    override fun create(parcel: Parcel): DateTrigger {
      return DateTrigger(parcel)
    }
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per month.
 */
@Parcelize
class MonthlyTrigger(override val channelId: String?, val day: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

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
class TimeIntervalTrigger(override val channelId: String?, val timeInterval: Long, val isRepeating: Boolean) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  @IgnoredOnParcel
  private var triggerDate = Date(Date().time + timeInterval * 1000)

  override fun nextTriggerDate(): Date? {
    val now = Date()

    if (isRepeating) {
      while (triggerDate.before(now)) {
        triggerDate.time += timeInterval * 1000
      }
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
