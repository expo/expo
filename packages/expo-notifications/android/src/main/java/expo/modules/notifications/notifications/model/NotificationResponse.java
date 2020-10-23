package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

/**
 * A POJO representing user's response to a notification. It may be a default action,
 * i.e. a tap on the notification ({@link #DEFAULT_ACTION_IDENTIFIER}).
 */
public class NotificationResponse implements Parcelable {
  public static final String DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";

  private NotificationAction mAction;
  private Notification mNotification;

  public NotificationResponse(NotificationAction action, Notification notification) {
    mAction = action;
    mNotification = notification;
  }

  public NotificationAction getAction() {
    return mAction;
  }

  public String getActionIdentifier() {
    return mAction.getIdentifier();
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
    mAction = in.readParcelable(getClass().getClassLoader());
    mNotification = in.readParcelable(getClass().getClassLoader());
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    dest.writeParcelable(mAction, 0);
    dest.writeParcelable(mNotification, 0);
  }
}
