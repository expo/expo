package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.enums.NotificationPriority;
import expo.modules.notifications.notifications.handling.NotificationsHandler;

/**
 * A POJO representing behavior with which the notification should be presented.
 * <p>
 * Used in {@link NotificationsHandler#handleNotificationAsync(String, ReadableArguments, Promise)}.
 */
public class NotificationBehavior implements Parcelable {
  private final boolean mShouldShowAlert;
  private final boolean mShouldPlaySound;
  private final boolean mShouldSetBadge;

  @Nullable
  private final String mPriorityOverride;

  public NotificationBehavior(boolean shouldShowAlert, boolean shouldPlaySound, boolean shouldSetBadge, @Nullable String priorityOverride) {
    mShouldShowAlert = shouldShowAlert;
    mShouldPlaySound = shouldPlaySound;
    mShouldSetBadge = shouldSetBadge;
    mPriorityOverride = priorityOverride;
  }

  private NotificationBehavior(Parcel in) {
    mShouldShowAlert = in.readByte() != 0;
    mShouldPlaySound = in.readByte() != 0;
    mShouldSetBadge = in.readByte() != 0;
    mPriorityOverride = in.readString();
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeByte((byte) (mShouldShowAlert ? 1 : 0));
    dest.writeByte((byte) (mShouldPlaySound ? 1 : 0));
    dest.writeByte((byte) (mShouldSetBadge ? 1 : 0));
    dest.writeString(mPriorityOverride);
  }

  @Override
  public int describeContents() {
    return 0;
  }

  public static final Creator<NotificationBehavior> CREATOR = new Creator<NotificationBehavior>() {
    @Override
    public NotificationBehavior createFromParcel(Parcel in) {
      return new NotificationBehavior(in);
    }

    @Override
    public NotificationBehavior[] newArray(int size) {
      return new NotificationBehavior[size];
    }
  };

  @Nullable
  public NotificationPriority getPriorityOverride() {
    if (mPriorityOverride == null) {
      return null;
    }
    return NotificationPriority.fromEnumValue(mPriorityOverride);
  }

  public boolean shouldShowAlert() {
    return mShouldShowAlert;
  }

  public boolean shouldPlaySound() {
    return mShouldPlaySound;
  }

  public boolean shouldSetBadge() {
    return mShouldSetBadge;
  }
}
