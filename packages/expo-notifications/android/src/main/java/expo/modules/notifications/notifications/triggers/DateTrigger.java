package expo.modules.notifications.notifications.triggers;

import android.os.Parcel;

import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * A schedulable trigger representing notification to be scheduled only once at a given moment of time.
 */
public class DateTrigger implements SchedulableNotificationTrigger {
  private Date mTriggerDate;

  public DateTrigger(long timestamp) {
    mTriggerDate = new Date(timestamp);
  }

  private DateTrigger(Parcel in) {
    mTriggerDate = new Date(in.readLong());
  }

  public Date getTriggerDate() {
    return mTriggerDate;
  }

  @Nullable
  @Override
  public Date nextTriggerDate() {
    Date now = new Date();

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
    dest.writeLong(mTriggerDate.getTime());
  }

  public static final Creator<DateTrigger> CREATOR = new Creator<DateTrigger>() {
    @Override
    public DateTrigger createFromParcel(Parcel in) {
      return new DateTrigger(in);
    }

    @Override
    public DateTrigger[] newArray(int size) {
      return new DateTrigger[size];
    }
  };
}
