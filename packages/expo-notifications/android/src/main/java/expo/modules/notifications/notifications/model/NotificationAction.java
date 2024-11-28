package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import java.io.Serializable;

/**
 * A class representing a single notification action button.
 *
 * TODO vonovak: no need to implement serializable, parcelable is enough for storing
 *
 */
public class NotificationAction implements Parcelable, Serializable {
  private final String mIdentifier;
  private final String mTitle;
  private final boolean mOpensAppToForeground;

  public NotificationAction(String identifier, String title, boolean opensAppToForeground) {
    mIdentifier = identifier;
    mTitle = title;
    mOpensAppToForeground = opensAppToForeground;
  }

  protected NotificationAction(Parcel in) {
    mIdentifier = in.readString();
    mTitle = in.readString();
    mOpensAppToForeground = in.readByte() != 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mIdentifier);
    dest.writeString(mTitle);
    dest.writeByte((byte) (mOpensAppToForeground ? 1 : 0));
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

  public boolean opensAppToForeground() {
    return mOpensAppToForeground;
  }
}
