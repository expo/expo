package expo.modules.notifications.notifications.service;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcel;
import android.util.Log;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;

/**
 * A broadcast receiver responsible for redirecting responses to notifications
 * to {@link BaseNotificationsService}.
 */
public class NotificationResponseReceiver extends BroadcastReceiver {
  public static final String NOTIFICATION_OPEN_APP_ACTION = "expo.modules.notifications.OPEN_APP_ACTION";
  public static final String NOTIFICATION_RESPONSE_KEY = "response";
  //                                      EXRespRcv
  private static final int REQUEST_CODE = 397377728;

  public static PendingIntent getActionIntent(Context context, String actionIdentifier, Notification notification) {
    Intent intent = new Intent(context, NotificationResponseReceiver.class);
    // By setting different data we make sure that intents with different actions
    // are different to the system.
    intent.setData(getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath(actionIdentifier).build());
    intent.putExtra(NOTIFICATION_RESPONSE_KEY, new NotificationResponse(actionIdentifier, notification));
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  protected static Uri.Builder getUriBuilderForIdentifier(String identifier) {
    return Uri.parse("expo-notifications://notifications/").buildUpon().appendPath(identifier);
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    NotificationResponse response = intent.getParcelableExtra(NOTIFICATION_RESPONSE_KEY);
    openAppToForeground(context, response);
    BaseNotificationsService.enqueueResponseReceived(context, response);
  }

  protected void openAppToForeground(Context context, NotificationResponse notificationResponse) {
    Intent notificationAppHandler = new Intent(NOTIFICATION_OPEN_APP_ACTION);
    notificationAppHandler.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    notificationAppHandler.setPackage(context.getApplicationContext().getPackageName());
    if (notificationAppHandler.resolveActivity(context.getPackageManager()) != null) {
      // Class loader used in BaseBundle when unmarshalling notification extras
      // cannot handle expo.modules.notifications.….NotificationResponse
      // so we go around it by marshalling and unmarshalling the object ourselves.
      notificationAppHandler.putExtra(NOTIFICATION_RESPONSE_KEY, marshallNotificationResponse(notificationResponse));
      context.startActivity(notificationAppHandler);
      return;
    }

    Intent mainActivity = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
    if (mainActivity == null) {
      Log.w("expo-notifications", "No launch intent found for application. Interacting with the notification won't open the app. The implementation uses `getLaunchIntentForPackage` to find appropriate activity.");
      return;
    }
    context.startActivity(mainActivity);
  }

  /**
   * Marshalls {@link NotificationResponse} into to a byte array.
   *
   * @param notificationResponse Notification response to marshall
   * @return Given request marshalled to a byte array or null if the process failed.
   */
  @Nullable
  private byte[] marshallNotificationResponse(NotificationResponse notificationResponse) {
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
}
