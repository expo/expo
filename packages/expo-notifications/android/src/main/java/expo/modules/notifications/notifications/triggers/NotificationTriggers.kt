package expo.modules.notifications.notifications.triggers

import android.os.Parcel
import android.os.Parcelable
import expo.modules.notifications.notifications.interfaces.NotificationTrigger
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger
import java.io.Serializable
import java.util.Calendar
import java.util.Date

open class ChannelAwareTrigger(
  private val channelId: String?
) : NotificationTrigger, Serializable {
  constructor(parcel: Parcel): this(parcel.readString())

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
class DailyTrigger : ChannelAwareTrigger, SchedulableNotificationTrigger {
  var hour: Int
    private set
  var minute: Int
    private set

  constructor(hour: Int, minute: Int, channelId: String?) : super(channelId) {
    this.hour = hour
    this.minute = minute
  }

  private constructor(parcel: Parcel) : super(parcel) {
    hour = `in`.readInt()
    minute = `in`.readInt()
  }

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
class DateTrigger : ChannelAwareTrigger, SchedulableNotificationTrigger {
  var triggerDate: Date
    private set

  constructor(timestamp: Long, channelId: String?) : super(channelId) {
    triggerDate = Date(timestamp)
  }

  private constructor(`in`: Parcel) : super(`in`) {
    triggerDate = Date(`in`.readLong())
  }

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
class MonthlyTrigger : ChannelAwareTrigger, SchedulableNotificationTrigger {
  var day: Int
    private set
  var hour: Int
    private set
  var minute: Int
    private set

  constructor(day: Int, hour: Int, minute: Int, channelId: String?) : super(channelId) {
    this.day = day
    this.hour = hour
    this.minute = minute
  }

  private constructor(`in`: Parcel) : super(`in`) {
    day = `in`.readInt()
    hour = `in`.readInt()
    minute = `in`.readInt()
  }

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
class TimeIntervalTrigger : ChannelAwareTrigger, SchedulableNotificationTrigger {
  private var mTriggerDate: Date
  var timeInterval: Long
    private set
  var isRepeating: Boolean
    private set

  constructor(timeInterval: Long, repeats: Boolean, channelId: String?) : super(channelId) {
    this.timeInterval = timeInterval
    mTriggerDate = Date(Date().time + this.timeInterval * 1000)
    isRepeating = repeats
  }

  private constructor(`in`: Parcel) : super(`in`) {
    mTriggerDate = Date(`in`.readLong())
    timeInterval = `in`.readLong()
    isRepeating = `in`.readByte().toInt() == 1
  }

  override fun nextTriggerDate(): Date? {
    val now = Date()

    if (isRepeating) {
      while (mTriggerDate.before(now)) {
        mTriggerDate.time += timeInterval * 1000
      }
    }

    if (mTriggerDate.before(now)) {
      return null
    }

    return mTriggerDate
  }

  override fun describeContents(): Int {
    return 0
  }

  override fun writeToParcel(dest: Parcel, flags: Int) {
    super.writeToParcel(dest, flags)
    dest.writeLong(mTriggerDate.time)
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
class WeeklyTrigger : ChannelAwareTrigger, SchedulableNotificationTrigger {
  var weekday: Int
    private set
  var hour: Int
    private set
  var minute: Int
    private set

  constructor(weekday: Int, hour: Int, minute: Int, channelId: String?) : super(channelId) {
    this.weekday = weekday
    this.hour = hour
    this.minute = minute
  }

  private constructor(`in`: Parcel) : super(`in`) {
    weekday = `in`.readInt()
    hour = `in`.readInt()
    minute = `in`.readInt()
  }

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
class YearlyTrigger : ChannelAwareTrigger, SchedulableNotificationTrigger {
  var day: Int
    private set
  var month: Int
    private set
  var hour: Int
    private set
  var minute: Int
    private set

  constructor(day: Int, month: Int, hour: Int, minute: Int, channelId: String?) : super(channelId) {
    this.day = day
    this.month = month
    this.hour = hour
    this.minute = minute
  }

  private constructor(`in`: Parcel) : super(`in`) {
    day = `in`.readInt()
    month = `in`.readInt()
    hour = `in`.readInt()
    minute = `in`.readInt()
  }

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
