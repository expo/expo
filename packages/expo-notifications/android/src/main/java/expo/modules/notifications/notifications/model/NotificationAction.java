package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;

/**
 * 
 */
public class NotificationAction implements Parcelable, Serializable {
  private final String mId;
  private final String mTitle;
  private final boolean mShouldOpenToForeground;

  public NotificationAction(String id, String title, boolean shouldOpenToForeground) {
    mId = id;
    mTitle = title;
    mShouldOpenToForeground = shouldOpenToForeground;
  }

  private NotificationAction(Parcel in) {
    mId = in.readString();
    mTitle = in.readString();
    mShouldOpenToForeground = in.readByte() != 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mId);
    dest.writeString(mTitle);
    dest.writeByte((byte) (mShouldOpenToForeground ? 1 : 0));
  }

  @Override
  public int describeContents() {
    return 0;
  }

  public static final Creator<NotificationAction> CREATOR = new Creator<NotificationAction>() {
    @Override
    public NotificationAction createFromParcel(Parcel in) {
      return new NotificationAction(in);
    }

    @Override
    public NotificationAction[] newArray(int size) {
      return new NotificationAction[size];
    }
  };

  public String getIdentifier() {
    return mId;
  }

  public String getTitle() {
    return mTitle;
  }

  public boolean shouldOpenToForeground() {
    return mShouldOpenToForeground;
  }
}
