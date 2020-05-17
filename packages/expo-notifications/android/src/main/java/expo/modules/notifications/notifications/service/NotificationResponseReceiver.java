package expo.modules.notifications.notifications.service;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;

/**
 * A broadcast receiver responsible for redirecting responses to notifications
 * to {@link BaseNotificationsService}.
 */
public class NotificationResponseReceiver extends BroadcastReceiver {
  private static final String NOTIFICATION_RESPONSE_KEY = "response";
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
    openAppToForeground(context);
    BaseNotificationsService.enqueueResponseReceived(context, intent.<NotificationResponse>getParcelableExtra(NOTIFICATION_RESPONSE_KEY));
  }

  protected void openAppToForeground(Context context) {
    Intent mainActivity = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
    if (mainActivity == null) {
      Log.w("expo-notifications", "No launch intent found for application. Interacting with the notification won't open the app. The implementation uses `getLaunchIntentForPackage` to find appropriate activity.");
      return;
    }
    context.startActivity(mainActivity);
  }
}
