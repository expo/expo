package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;

import expo.modules.notifications.notifications.model.notificationaction;

/**
 * 
 */
public class NotificationCategory implements Parcelable, Serializable {
  private final String mId;
  private final NotificationAction[] mActions;

  public NotificationCategory(String id, NotificationAction[] actions) {
    mId = id;
    mActions = actions;
  }

  private NotificationCategory(Parcel in) {
    mId = in.readString();
    mActions = in.readParcelable(getClass().getClassLoader());
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mId);
    dest.writeParcelable(mActions, 0);
  }

  @Override
  public int describeContents() {
    return 0;
  }

  public static final Creator<NotificationCategory> CREATOR = new Creator<NotificationCategory>() {
    @Override
    public NotificationCategory createFromParcel(Parcel in) {
      return new NotificationCategory(in);
    }

    @Override
    public NotificationCategory[] newArray(int size) {
      return new NotificationCategory[size];
    }
  };

  public String getIdentifier() {
    return mId;
  }

  public NotificationAction[] getActions() {
    return mActions;
  }

}
