package expo.modules.notifications.notifications.service;

import androidx.core.app.RemoteInput;
import android.os.Bundle;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Parcel;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.notifications.model.TextInputNotificationResponse;

/**
 * A broadcast receiver responsible for redirecting responses to text input notifications
 * to {@link BaseNotificationsService}.
 */
public class TextInputNotificationResponseReceiver extends NotificationResponseReceiver {
  public static final String USER_TEXT_RESPONSE = "userTextResponse";

  public static PendingIntent getActionIntent(Context context, TextInputNotificationAction action, Notification notification) {
    Intent intent = new Intent(context, TextInputNotificationResponseReceiver.class);
    // By setting different data we make sure that intents with different actions
    // are different to the system.
    intent.setData(getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath(action.getIdentifier()).build());
    intent.putExtra(NOTIFICATION_RESPONSE_KEY, new TextInputNotificationResponse(action.getIdentifier(), notification, null));
    intent.putExtra(ACTION_FOREGROUNDS_APP, action.opensAppToForeground());
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    TextInputNotificationResponse response = intent.getParcelableExtra(NOTIFICATION_RESPONSE_KEY);
    response.setUserText(getMessageText(intent));
    if (intent.getBooleanExtra(ACTION_FOREGROUNDS_APP, true)) {
      openAppToForeground(context, response);
    }
    BaseNotificationsService.enqueueResponseReceived(context, response);
  }

  private String getMessageText(Intent intent) {
    Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
    if (remoteInput != null) {
        return remoteInput.getCharSequence(USER_TEXT_RESPONSE).toString();
    }
    return null;
  }

  /**
   * Reconstructs TextInputNotificationResponse from Intent.
   *
   * @param intent
   * @return TextInputNotificationResponse instance or null if intent doesn't contain a response
   */
  @Nullable
  public static TextInputNotificationResponse getTextInputNotificationResponse(@NonNull Intent intent) {
    return TextInputNotificationResponseReceiver.unmarshallTextInputNotificationResponse(intent.getByteArrayExtra(NOTIFICATION_RESPONSE_KEY));
  }

  /**
   * Marshalls {@link TextInputNotificationResponse} into to a byte array.
   *
   * @param notificationResponse Text input notification response to marshall
   * @return Given request marshalled to a byte array or null if the process failed.
   */
  @Nullable
  private byte[] marshallTextInputNotificationResponse(TextInputNotificationResponse notificationResponse) {
    try {
      Parcel parcel = Parcel.obtain();
      notificationResponse.writeToParcel(parcel, 0);
      byte[] bytes = parcel.marshall();
      parcel.recycle();
      return bytes;
    } catch (Exception e) {
      // If we couldn't marshall the request, let's not fail the whole build process.
      Log.e("expo-notifications", String.format("Could not marshalled notification response: %s.", notificationResponse.getActionIdentifier()));
      e.printStackTrace();
      return null;
    }
  }

  /**
   * UNmarshalls {@link TextInputNotificationResponse} from a byte array.
   *
   * @param notificationRequestByteArray
   * @return TextInputNotificationResponse instance or null if the process failed.
   */
  @Nullable
  public static TextInputNotificationResponse unmarshallTextInputNotificationResponse(@Nullable byte[] notificationRequestByteArray) {
    if (notificationRequestByteArray == null) {
      return null;
    }
    try {
      Parcel parcel = Parcel.obtain();
      parcel.unmarshall(notificationRequestByteArray, 0, notificationRequestByteArray.length);
      parcel.setDataPosition(0);
      TextInputNotificationResponse response = TextInputNotificationResponse.CREATOR.createFromParcel(parcel);
      parcel.recycle();
      return response;
    } catch (Exception e) {
      Log.e("expo-notifications", "Could not unmarshall TextInputNotificationResponse from Intent.extra.", e);
    }
    return null;
  }
}