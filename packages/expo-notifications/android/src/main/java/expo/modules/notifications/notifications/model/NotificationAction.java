package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;
import java.io.Serializable;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;

/**
 * A class representing a single notification action button.
 */
public class NotificationAction implements Parcelable, Serializable {
  private final String mIdentifier;
  private final String mTitle;
  private final boolean mShouldOpenToForeground;

  public NotificationAction(String identifier, String title, boolean shouldOpenToForeground) {
    mIdentifier = identifier;
    mTitle = title;
    mShouldOpenToForeground = shouldOpenToForeground;
  }

  private NotificationAction(Parcel in) {
    mIdentifier = in.readString();
    mTitle = in.readString();
    mShouldOpenToForeground = in.readByte() != 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mIdentifier);
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
    return mIdentifier;
  }

  public String getTitle() {
    return mTitle;
  }

  public boolean shouldOpenToForeground() {
    return mShouldOpenToForeground;
  }
}
