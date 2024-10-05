package expo.modules.notifications.notifications.triggers

import android.os.Parcel
import android.os.Parcelable
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import java.io.Serializable
import java.util.Calendar
import java.util.Date

open class ChannelAwareTrigger(open val channelId: String?) :
  NotificationTrigger, Serializable {
  constructor(parcel: Parcel) : this(parcel.readString())

  override fun describeContents(): Int = 0

  override fun writeToParcel(dest: Parcel, flags: Int) {
    dest.writeString(channelId)
  }

  override fun getNotificationChannel(): String? {
    return channelId
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<ChannelAwareTrigger?> =
      object : Parcelable.Creator<ChannelAwareTrigger?> {
        override fun createFromParcel(`in`: Parcel): ChannelAwareTrigger {
          return ChannelAwareTrigger(`in`)
        }

        override fun newArray(size: Int): Array<ChannelAwareTrigger?> {
          return arrayOfNulls(size)
        }
      }
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per day.
 */
class DailyTrigger(override val channelId: String?, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

  private constructor(parcel: Parcel) : this(parcel.readString(), parcel.readInt(), parcel.readInt())

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

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeInt(hour)
    dest.writeInt(minute)
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<DailyTrigger?> = object : Parcelable.Creator<DailyTrigger?> {
      override fun createFromParcel(`in`: Parcel): DailyTrigger {
        return DailyTrigger(`in`)
      }

      override fun newArray(size: Int): Array<DailyTrigger?> {
        return arrayOfNulls(size)
      }
    }
  }
}

/**
 * A schedulable trigger representing notification to be scheduled only once at a given moment of time.
 */
class DateTrigger(override val channelId: String?, private val timestamp: Long) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  val triggerDate = Date(timestamp)

  private constructor(parcel: Parcel) : this(parcel.readString(), parcel.readLong())

  override fun nextTriggerDate(): Date? {
    val now = Date()

    if (triggerDate.before(now)) {
      return null
    }

    return triggerDate
  }

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeLong(triggerDate.time)
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<DateTrigger?> = object : Parcelable.Creator<DateTrigger?> {
      override fun createFromParcel(`in`: Parcel): DateTrigger {
        return DateTrigger(`in`)
      }

      override fun newArray(size: Int): Array<DateTrigger?> {
        return arrayOfNulls(size)
      }
    }
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per month.
 */
class MonthlyTrigger(override val channelId: String?, val day: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

  private constructor(parcel: Parcel) : this(parcel.readString(), parcel.readInt(), parcel.readInt(), parcel.readInt())

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

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeInt(day)
    dest.writeInt(hour)
    dest.writeInt(minute)
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<MonthlyTrigger?> = object : Parcelable.Creator<MonthlyTrigger?> {
      override fun createFromParcel(`in`: Parcel): MonthlyTrigger {
        return MonthlyTrigger(`in`)
      }

      override fun newArray(size: Int): Array<MonthlyTrigger?> {
        return arrayOfNulls(size)
      }
    }
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
class TimeIntervalTrigger(override val channelId: String?, val timeInterval: Long, private val repeats: Boolean) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {
  private var triggerDate = Date(Date().time + timeInterval * 1000)
  val isRepeating = repeats

  private constructor(parcel: Parcel) : this(parcel.readString(), parcel.readLong(), parcel.readByte().toInt() == 1)

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

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeLong(timeInterval)
    dest.writeByte((if (isRepeating) 1 else 0).toByte())
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<TimeIntervalTrigger?> =
      object : Parcelable.Creator<TimeIntervalTrigger?> {
        override fun createFromParcel(`in`: Parcel): TimeIntervalTrigger {
          return TimeIntervalTrigger(`in`)
        }

        override fun newArray(size: Int): Array<TimeIntervalTrigger?> {
          return arrayOfNulls(size)
        }
      }
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per week.
 */
class WeeklyTrigger(override val channelId: String?, val weekday: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

  private constructor(parcel: Parcel) : this(parcel.readString(), parcel.readInt(), parcel.readInt(), parcel.readInt())

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

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeInt(weekday)
    dest.writeInt(hour)
    dest.writeInt(minute)
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<WeeklyTrigger?> = object : Parcelable.Creator<WeeklyTrigger?> {
      override fun createFromParcel(`in`: Parcel): WeeklyTrigger {
        return WeeklyTrigger(`in`)
      }

      override fun newArray(size: Int): Array<WeeklyTrigger?> {
        return arrayOfNulls(size)
      }
    }
  }
}

/**
 * A schedulable trigger representing a notification to be scheduled once per year.
 */
class YearlyTrigger(override val channelId: String?, val day: Int, val month: Int, val hour: Int, val minute: Int) : ChannelAwareTrigger(channelId), SchedulableNotificationTrigger {

  private constructor(parcel: Parcel) : this(parcel.readString(), parcel.readInt(), parcel.readInt(), parcel.readInt(), parcel.readInt())

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

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeInt(day)
    dest.writeInt(month)
    dest.writeInt(hour)
    dest.writeInt(minute)
  }

  companion object {
    @JvmField
    val CREATOR: Parcelable.Creator<YearlyTrigger?> = object : Parcelable.Creator<YearlyTrigger?> {
      override fun createFromParcel(`in`: Parcel): YearlyTrigger {
        return YearlyTrigger(`in`)
      }

      override fun newArray(size: Int): Array<YearlyTrigger?> {
        return arrayOfNulls(size)
      }
    }
  }
}
