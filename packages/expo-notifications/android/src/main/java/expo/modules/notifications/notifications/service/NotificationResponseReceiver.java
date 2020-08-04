package expo.modules.notifications.notifications.service;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Parcel;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationsScoper;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationResponse;

/**
 * A broadcast receiver responsible for redirecting responses to notifications
 * to {@link NotificationsHelper}.
 */
public class NotificationResponseReceiver extends BroadcastReceiver {
  public static final String NOTIFICATION_OPEN_APP_ACTION = "expo.modules.notifications.OPEN_APP_ACTION";
  public static final String NOTIFICATION_RESPONSE_KEY = "response";
  public static final String ACTION_FOREGROUNDS_APP = "opensAppToForeground";
  //                                        EXRespRcv
  protected static final int REQUEST_CODE = 397377728;

  public static PendingIntent getActionIntent(Context context, NotificationAction action, Notification notification) {
    Intent intent = new Intent(context, NotificationResponseReceiver.class);
    // By setting different data we make sure that intents with different actions
    // are different to the system.
    intent.setData(getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath(action.getIdentifier()).build());
    intent.putExtra(NOTIFICATION_RESPONSE_KEY, new NotificationResponse(action.getIdentifier(), notification));
    intent.putExtra(ACTION_FOREGROUNDS_APP, action.opensAppToForeground());
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  protected static Uri.Builder getUriBuilderForIdentifier(String identifier) {
    return Uri.parse("expo-notifications://notifications/").buildUpon().appendPath(identifier);
  }

  @Override
  public void onReceive(Context context, Intent intent) {
    NotificationResponse response = intent.getParcelableExtra(NOTIFICATION_RESPONSE_KEY);
    if (intent.getBooleanExtra(ACTION_FOREGROUNDS_APP, true)) {
      openAppToForeground(context, response);
    }
    getNotificationsHelper(context).responseReceived(response);
  }

  protected NotificationsHelper getNotificationsHelper(Context context) {
    return new NotificationsHelper(context, NotificationsScoper.create(context).createReconstructor());
  }

  protected void openAppToForeground(Context context, NotificationResponse notificationResponse) {
    Intent appLauncher = getNotificationActionLauncher(context, notificationResponse);
    if (appLauncher != null) {
      context.startActivity(appLauncher);
      return;
    }

    appLauncher = getMainActivityLauncher(context);
    if (appLauncher == null) {
      Log.w("expo-notifications", "No launch intent found for application. Interacting with the notification won't open the app. The implementation uses `getLaunchIntentForPackage` to find appropriate activity.");
      return;
    }
    context.startActivity(appLauncher);
  }

  private Intent getNotificationActionLauncher(Context context, NotificationResponse notificationResponse) {
    Intent notificationActionLauncher = new Intent(NOTIFICATION_OPEN_APP_ACTION);
    notificationActionLauncher.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    notificationActionLauncher.setPackage(context.getApplicationContext().getPackageName());
    if (notificationActionLauncher.resolveActivity(context.getPackageManager()) != null) {
      // Class loader used in BaseBundle when unmarshalling notification extras
      // cannot handle expo.modules.notifications.….NotificationResponse
      // so we go around it by marshalling and unmarshalling the object ourselves.
      notificationActionLauncher.putExtra(NOTIFICATION_RESPONSE_KEY, marshallNotificationResponse(notificationResponse));
      return notificationActionLauncher;
    }

    return null;
  }

  private Intent getMainActivityLauncher(Context context) {
    return context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
  }

  /**
   * Reconstructs NotificationResponse from Intent.
   *
   * @param intent
   * @return NotificationResponse instance or null if intent doesn't contain a response
   */
  @Nullable
  public static NotificationResponse getNotificationResponse(@NonNull Intent intent) {
    return NotificationResponseReceiver.unmarshallNotificationResponse(intent.getByteArrayExtra(NOTIFICATION_RESPONSE_KEY));
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

  /**
   * UNmarshalls {@link NotificationResponse} from a byte array.
   *
   * @param notificationRequestByteArray
   * @return NotificationResponse instance or null if the process failed.
   */
  @Nullable
  public static NotificationResponse unmarshallNotificationResponse(@Nullable byte[] notificationRequestByteArray) {
    if (notificationRequestByteArray == null) {
      return null;
    }
    try {
      Parcel parcel = Parcel.obtain();
      parcel.unmarshall(notificationRequestByteArray, 0, notificationRequestByteArray.length);
      parcel.setDataPosition(0);
      NotificationResponse response = NotificationResponse.CREATOR.createFromParcel(parcel);
      parcel.recycle();
      return response;
    } catch (Exception e) {
      Log.e("expo-notifications", "Could not unmarshall NotificationResponse from Intent.extra.", e);
    }
    return null;
  }
}
