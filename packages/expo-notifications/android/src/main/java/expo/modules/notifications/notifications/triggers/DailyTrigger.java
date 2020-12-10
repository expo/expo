package expo.modules.notifications.notifications.triggers;

import android.os.Parcel;

import java.util.Calendar;
import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * A schedulable trigger representing a notification to be scheduled once per day.
 */
public class DailyTrigger extends ChannelAwareTrigger implements SchedulableNotificationTrigger {
  private int mHour;
  private int mMinute;

  public DailyTrigger(int hour, int minute, @Nullable String channelId) {
    super(channelId);
    mHour = hour;
    mMinute = minute;
  }

  private DailyTrigger(Parcel in) {
    super(in);
    mHour = in.readInt();
    mMinute = in.readInt();
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
    nextTriggerDate.set(Calendar.HOUR_OF_DAY, mHour);
    nextTriggerDate.set(Calendar.MINUTE, mMinute);
    nextTriggerDate.set(Calendar.SECOND, 0);
    nextTriggerDate.set(Calendar.MILLISECOND, 0);
    Calendar rightNow = Calendar.getInstance();
    if (nextTriggerDate.before(rightNow)) {
      nextTriggerDate.add(Calendar.DATE, 1);
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
    dest.writeInt(mHour);
    dest.writeInt(mMinute);
  }

  public static final Creator<DailyTrigger> CREATOR = new Creator<DailyTrigger>() {
    @Override
    public DailyTrigger createFromParcel(Parcel in) {
      return new DailyTrigger(in);
    }

    @Override
    public DailyTrigger[] newArray(int size) {
      return new DailyTrigger[size];
    }
  };
}
