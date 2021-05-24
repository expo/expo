package expo.modules.notifications.notifications.triggers;

import android.os.Parcel;

import java.util.Calendar;
import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * A schedulable trigger representing a notification to be scheduled once per year.
 */
public class YearlyTrigger extends ChannelAwareTrigger implements SchedulableNotificationTrigger {
  private int mDay;
  private int mMonth;
  private int mHour;
  private int mMinute;

  public YearlyTrigger(int day, int month, int hour, int minute, @Nullable String channelId) {
    super(channelId);
    mDay = day;
    mMonth = month;
    mHour = hour;
    mMinute = minute;
  }

  private YearlyTrigger(Parcel in) {
    super(in);
    mDay = in.readInt();
    mMonth = in.readInt();
    mHour = in.readInt();
    mMinute = in.readInt();
  }

  public int getDay() {
    return mDay;
  }

  public int getMonth() {
    return mMonth;
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
    nextTriggerDate.set(Calendar.DATE, mDay);
    nextTriggerDate.set(Calendar.MONTH, mMonth);
    nextTriggerDate.set(Calendar.HOUR_OF_DAY, mHour);
    nextTriggerDate.set(Calendar.MINUTE, mMinute);
    nextTriggerDate.set(Calendar.SECOND, 0);
    nextTriggerDate.set(Calendar.MILLISECOND, 0);
    Calendar rightNow = Calendar.getInstance();
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.YEAR, 1);
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
    dest.writeInt(mDay);
    dest.writeInt(mMonth);
    dest.writeInt(mHour);
    dest.writeInt(mMinute);
  }

  public static final Creator<YearlyTrigger> CREATOR = new Creator<YearlyTrigger>() {
    @Override
    public YearlyTrigger createFromParcel(Parcel in) {
      return new YearlyTrigger(in);
    }

    @Override
    public YearlyTrigger[] newArray(int size) {
      return new YearlyTrigger[size];
    }
  };
}
