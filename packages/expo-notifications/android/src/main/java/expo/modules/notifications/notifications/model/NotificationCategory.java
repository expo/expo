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
  // Categories are stored with Java serialization. Without a declared UID the
  // computed one covers the synthetic constructor CREATOR calls, whose
  // parameter type is a class the dexer synthesizes and R8 renames, so a build
  // minified differently can't read the stored categories. This is the value
  // non-minified (D8) builds compute, so their stored categories stay readable.
  private static final long serialVersionUID = -7231554903600752807L;

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
