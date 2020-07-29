package expo.modules.notifications.notifications.triggers;

import android.os.Parcel;

import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * A schedulable trigger representing notification to be scheduled after X milliseconds,
 * optionally repeating.
 * <p>
 * <i>Note: The implementation ensures that the trigger times do not drift away too much from the
 * * initial time, so eg. a trigger started at 11111000 time repeated every 1000 ms should always
 * * trigger around …000 timestamp.</i>
 */
public class TimeIntervalTrigger extends ChannelAwareTrigger implements SchedulableNotificationTrigger {
  private Date mTriggerDate;
  private long mTimeInterval;
  private boolean mRepeats;

  public TimeIntervalTrigger(long timeInterval, boolean repeats, @Nullable String channelId) {
    super(channelId);
    mTimeInterval = timeInterval;
    mTriggerDate = new Date(new Date().getTime() + mTimeInterval * 1000);
    mRepeats = repeats;
  }

  private TimeIntervalTrigger(Parcel in) {
    super(in);
    mTriggerDate = new Date(in.readLong());
    mTimeInterval = in.readLong();
    mRepeats = in.readByte() == 1;
  }

  public boolean isRepeating() {
    return mRepeats;
  }

  public long getTimeInterval() {
    return mTimeInterval;
  }

  @Nullable
  @Override
  public Date nextTriggerDate() {
    Date now = new Date();

    if (mRepeats) {
      while (mTriggerDate.before(now)) {
        mTriggerDate.setTime(mTriggerDate.getTime() + mTimeInterval * 1000);
      }
    }

    if (mTriggerDate.before(now)) {
      return null;
    }

    return mTriggerDate;
  }

  @Override
  public int describeContents() {
    return 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    super.writeToParcel(dest, flags);
    dest.writeLong(mTriggerDate.getTime());
    dest.writeLong(mTimeInterval);
    dest.writeByte((byte) (mRepeats ? 1 : 0));
  }

  public static final Creator<TimeIntervalTrigger> CREATOR = new Creator<TimeIntervalTrigger>() {
    @Override
    public TimeIntervalTrigger createFromParcel(Parcel in) {
      return new TimeIntervalTrigger(in);
    }

    @Override
    public TimeIntervalTrigger[] newArray(int size) {
      return new TimeIntervalTrigger[size];
    }
  };
}
