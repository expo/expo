package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import java.io.Serializable;
import java.util.Collections;
import java.util.List;

/**
 * A class representing a collection of notification actions.
 *
 * TODO vonovak: no need to implement serializable, parcelable is enough for storing
 */
public class NotificationCategory implements Parcelable, Serializable {
  private final String mIdentifier;
  private final List<NotificationAction> mActions;

  public NotificationCategory(String identifier, List<NotificationAction> actions) {
    mIdentifier = identifier;
    mActions = actions;
  }

  private NotificationCategory(Parcel in) {
    mIdentifier = in.readString();
    mActions = in.readArrayList(NotificationAction.class.getClassLoader());
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mIdentifier);
    dest.writeList(mActions);
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
    return mIdentifier;
  }

  public List<NotificationAction> getActions() {
    if (mActions == null) {
      return Collections.emptyList();
    }
    return mActions;
  }

}
