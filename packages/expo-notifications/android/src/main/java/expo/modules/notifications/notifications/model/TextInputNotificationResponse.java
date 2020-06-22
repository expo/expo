package expo.modules.notifications.notifications.model;

import android.os.Parcel;
import android.os.Parcelable;

import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;

import androidx.annotation.Nullable;

/**
 * 
 */
public class TextInputNotificationResponse extends NotificationResponse {
    private String mUserText;

    public NotificationResponse(String userText) {
        mUserText = userText;
    }

    public String getUserText() {
        return mUserText;
    }

}
