package expo.modules.notifications.notifications.triggers;

import android.os.Parcel;

import java.util.Calendar;
import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * A schedulable trigger representing a notification to be scheduled once per week.
 */
public class WeeklyTrigger extends ChannelAwareTrigger implements SchedulableNotificationTrigger {
  private int mWeekday;
  private int mHour;
  private int mMinute;

  public WeeklyTrigger(int weekday, int hour, int minute, @Nullable String channelId) {
    super(channelId);
    mWeekday = weekday;
    mHour = hour;
    mMinute = minute;
  }

  private WeeklyTrigger(Parcel in) {
    super(in);
    mWeekday = in.readInt();
    mHour = in.readInt();
    mMinute = in.readInt();
  }

  public int getWeekday() {
    return mWeekday;
  }

  public int getHour() {
    return mHour;
  }

  public int getMinute() {
    return mMinute;
  }

  @Nullable
  @Override
  public Date nextTriggerDate() {
    Calendar nextTriggerDate = Calendar.getInstance();
    nextTriggerDate.set(Calendar.DAY_OF_WEEK, mWeekday);
    nextTriggerDate.set(Calendar.HOUR_OF_DAY, mHour);
    nextTriggerDate.set(Calendar.MINUTE, mMinute);
    nextTriggerDate.set(Calendar.SECOND, 0);
    nextTriggerDate.set(Calendar.MILLISECOND, 0);
    Calendar rightNow = Calendar.getInstance();
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.DAY_OF_WEEK_IN_MONTH, 1);
    }
    return nextTriggerDate.getTime();
  }

  @Override
  public int describeContents() {
    return 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    super.writeToParcel(dest, flags);
    dest.writeInt(mWeekday);
    dest.writeInt(mHour);
    dest.writeInt(mMinute);
  }

  public static final Creator<WeeklyTrigger> CREATOR = new Creator<WeeklyTrigger>() {
    @Override
    public WeeklyTrigger createFromParcel(Parcel in) {
      return new WeeklyTrigger(in);
    }

    @Override
    public WeeklyTrigger[] newArray(int size) {
      return new WeeklyTrigger[size];
    }
  };
}
