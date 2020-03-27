package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

/**
 * A POJO representing user's response to a notification. It may be a default action,
 * i.e. a tap on the notification ({@link #DEFAULT_ACTION_IDENTIFIER}).
 */
public class NotificationResponse implements Parcelable {
  public static final String DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";

  private String mActionIdentifier;
  private Notification mNotification;

  public NotificationResponse(String actionIdentifier, Notification notification) {
    mActionIdentifier = actionIdentifier;
    mNotification = notification;
  }

  public String getActionIdentifier() {
    return mActionIdentifier;
  }

  public Notification getNotification() {
    return mNotification;
  }

  public static final Creator<NotificationResponse> CREATOR = new Creator<NotificationResponse>() {
    @Override
    public NotificationResponse createFromParcel(Parcel in) {
      return new NotificationResponse(in);
    }

    @Override
    public NotificationResponse[] newArray(int size) {
      return new NotificationResponse[size];
    }
  };

  @Override
  public int describeContents() {
    return 0;
  }

  protected NotificationResponse(Parcel in) {
    mActionIdentifier = in.readString();
    mNotification = in.readParcelable(getClass().getClassLoader());
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeString(mActionIdentifier);
    dest.writeParcelable(mNotification, 0);
  }
}
