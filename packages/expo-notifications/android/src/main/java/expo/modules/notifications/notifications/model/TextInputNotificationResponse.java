package expo.modules.notifications.notifications.model;

import android.os.Parcel;

/**
 * A POJO representing user's response to a text input notification action
 */
public class TextInputNotificationResponse extends NotificationResponse {
  private String mUserText;

  public TextInputNotificationResponse(NotificationAction action, Notification notification, String userText) {
    super(action, notification);
    mUserText = userText;
  }

  public String getUserText() {
    return mUserText;
  }

  public static final Creator<TextInputNotificationResponse> CREATOR = new Creator<TextInputNotificationResponse>() {
    @Override
    public TextInputNotificationResponse createFromParcel(Parcel in) {
      return new TextInputNotificationResponse(in);
    }

    @Override
    public TextInputNotificationResponse[] newArray(int size) {
      return new TextInputNotificationResponse[size];
    }
  };

  protected TextInputNotificationResponse(Parcel in) {
    super(in);
    mUserText = in.readString();
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    super.writeToParcel(dest, flags);
    dest.writeString(mUserText);
  }
}
