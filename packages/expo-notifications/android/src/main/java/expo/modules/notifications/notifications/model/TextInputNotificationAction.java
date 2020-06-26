package expo.modules.notifications.notifications.model;

import android.content.Context;
import android.os.Parcel;
import android.os.Parcelable;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;

/**
 * A class representing a single direct reply notification action.
 */
public class TextInputNotificationAction extends NotificationAction {
  private final String mSubmitButtonTitle;
  private final String mPlaceholder;

  public TextInputNotificationAction(String identifier, String title, boolean opensAppToForeground, String submitButtonTitle, String placeholder) {
    super(identifier, title, opensAppToForeground);
    mSubmitButtonTitle = submitButtonTitle;
    mPlaceholder = placeholder;
  }

  private TextInputNotificationAction(Parcel in) {
    super(in);
    mSubmitButtonTitle = in.readString();
    mPlaceholder = in.readString();
  }

  @Override
  public void writeToParcel(Parcel dest, int flags) {
    super.writeToParcel(dest, flags);
    dest.writeString(mSubmitButtonTitle);
    dest.writeString(mPlaceholder);
  }

  public static final Creator<TextInputNotificationAction> CREATOR = new Creator<TextInputNotificationAction>() {
    @Override
    public TextInputNotificationAction createFromParcel(Parcel in) {
      return new TextInputNotificationAction(in);
    }

    @Override
    public TextInputNotificationAction[] newArray(int size) {
      return new TextInputNotificationAction[size];
    }
  };

  public String getSubmitButtonTitle() {
    if (mSubmitButtonTitle != null) {
      return mSubmitButtonTitle;
    }
    return super.getTitle();
  }

  public String getPlaceholder() {
    if (mPlaceholder != null) {
      return mPlaceholder;
    }
    return "Type something";
  }
}
