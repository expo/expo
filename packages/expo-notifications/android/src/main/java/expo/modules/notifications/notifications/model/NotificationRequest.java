package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import java.io.Serializable;

import expo.modules.notifications.notifications.interfaces.NotificationTrigger;

/**
 * A class representing notification request. A notification request has some content {@link #mContent},
 * is triggered by some {@link #mTrigger} and is identifiable by {@link #mIdentifier}.
 */
public class NotificationRequest implements Parcelable, Serializable {
  private String mIdentifier;
  private NotificationContent mContent;
  private NotificationTrigger mTrigger;

  public NotificationRequest(String identifier, NotificationContent content, NotificationTrigger trigger) {
    mIdentifier = identifier;
    mContent = content;
    mTrigger = trigger;
  }

  public NotificationContent getContent() {
    return mContent;
  }

  public String getIdentifier() {
    return mIdentifier;
  }

  public NotificationTrigger getTrigger() {
    return mTrigger;
  }

  protected NotificationRequest(Parcel in) {
    mIdentifier = in.readString();
    mContent = in.readParcelable(getClass().getClassLoader());
    mTrigger = in.readParcelable(getClass().getClassLoader());
  }

  public static final Creator<NotificationRequest> CREATOR = new Creator<NotificationRequest>() {
    @Override
    public NotificationRequest createFromParcel(Parcel in) {
      return new NotificationRequest(in);
    }

    @Override
    public NotificationRequest[] newArray(int size) {
      return new NotificationRequest[size];
    }
  };

  @Override
  public int describeContents() {
    return 0;
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mIdentifier);
    dest.writeParcelable(mContent, 0);
    dest.writeParcelable(mTrigger, 0);
  }
}
