package expo.modules.notifications.notifications.handling;

import android.os.Parcel;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationBehavior;

/**
 * An implementation of {@link NotificationBehavior} capable of
 * "deserialization" of behavior objects with which the app responds.
 * <p>
 * Used in {@link NotificationsHandler#handleNotificationAsync(String, ReadableArguments, Promise)}
 * to pass the behavior to {@link SingleNotificationHandlerTask}.
 */
public class ExpoNotificationBehavior implements NotificationBehavior {
  private static final String SHOULD_SHOW_ALERT_KEY = "shouldShowAlert";
  private static final String SHOULD_PLAY_SOUND_KEY = "shouldPlaySound";
  private static final String SHOULD_SET_BADGE_KEY = "shouldSetBadge";
  private static final String PRIORITY_KEY = "priority";

  private boolean mShouldShowAlert;
  private boolean mShouldPlaySound;
  private boolean mShouldSetBadge;

  @Nullable
  private String mPriorityOverride;

  ExpoNotificationBehavior(ReadableArguments arguments) {
    mShouldShowAlert = arguments.getBoolean(SHOULD_SHOW_ALERT_KEY);
    mShouldPlaySound = arguments.getBoolean(SHOULD_PLAY_SOUND_KEY);
    mShouldSetBadge = arguments.getBoolean(SHOULD_SET_BADGE_KEY);
    mPriorityOverride = arguments.getString(PRIORITY_KEY);
  }

  private ExpoNotificationBehavior(Parcel in) {
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

  public static final Creator<ExpoNotificationBehavior> CREATOR = new Creator<ExpoNotificationBehavior>() {
    @Override
    public ExpoNotificationBehavior createFromParcel(Parcel in) {
      return new ExpoNotificationBehavior(in);
    }

    @Override
    public ExpoNotificationBehavior[] newArray(int size) {
      return new ExpoNotificationBehavior[size];
    }
  };

  @Nullable
  @Override
  public String getPriorityOverride() {
    return mPriorityOverride;
  }

  @Override
  public boolean shouldShowAlert() {
    return mShouldShowAlert;
  }

  @Override
  public boolean shouldPlaySound() {
    return mShouldPlaySound;
  }

  @Override
  public boolean shouldSetBadge() {
    return mShouldSetBadge;
  }
}
