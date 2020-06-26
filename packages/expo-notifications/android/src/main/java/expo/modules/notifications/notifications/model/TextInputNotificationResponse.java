package expo.modules.notifications.notifications.model;

import android.content.Context;
import android.os.Parcel;
import android.os.Parcelable;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;

/**
 * A POJO representing user's response to a text input notification action
 */
public class TextInputNotificationResponse extends NotificationResponse {
  private String mUserText;

  public TextInputNotificationResponse(String actionIdentifier, Notification notification, String userText) {
    super(actionIdentifier, notification);
    mUserText = userText;
  }

  public String getUserText() {
    return mUserText;
  }

  public void setUserText(String userText) {
    mUserText = userText;
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
