package expo.modules.notifications.notifications.service;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.ResultReceiver;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.JobIntentService;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationResponse;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public abstract class BaseNotificationsHelper extends JobIntentService {
  public static final String NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT";

  // Known result codes
  public static final int SUCCESS_CODE = 0;
  public static final int EXCEPTION_OCCURRED_CODE = -1;
  public static final String EXCEPTION_KEY = "exception";
  public static final String NOTIFICATIONS_KEY = "notifications";

  // Intent extras keys
  public static final String NOTIFICATION_KEY = "notification";
  public static final String NOTIFICATION_IDENTIFIER_KEY = "id";
  public static final String NOTIFICATION_BEHAVIOR_KEY = "behavior";
  public static final String NOTIFICATION_RESPONSE_KEY = "response";
  public static final String EVENT_TYPE_KEY = "type";
  public static final String RECEIVER_KEY = "receiver";

  public static final String GET_ALL_DISPLAYED = "getAllDisplayed";
  public static final String PRESENT_TYPE = "present";
  public static final String DISMISS_TYPE = "dismiss";
  public static final String DISMISS_SELECTED_TYPE = "dismissSelected";
  public static final String DISMISS_ALL_TYPE = "dismissAll";
  public static final String RECEIVE_TYPE = "receive";
  public static final String DROPPED_TYPE = "dropped";
  public static final String RESPONSE_TYPE = "response";

  private static final int JOB_ID = BaseNotificationsHelper.class.getName().hashCode();

  /**
   * A helper function for dispatching a "fetch all displayed notifications" command to the service.
   *
   * @param context  Context where to start the service.
   * @param receiver A receiver to which send the notifications
   */
  public static void enqueueGetAllPresented(Context context, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilder().build());
    intent.putExtra(EVENT_TYPE_KEY, GET_ALL_DISPLAYED);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "present notification" command to the service.
   *
   * @param context      Context where to start the service.
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   * @param receiver     A receiver to which send the result of presenting the notification
   */
  public static void enqueuePresent(Context context, @NonNull Notification notification, @Nullable NotificationBehavior behavior, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath("present").build());
    intent.putExtra(EVENT_TYPE_KEY, PRESENT_TYPE);
    intent.putExtra(NOTIFICATION_KEY, notification);
    intent.putExtra(NOTIFICATION_BEHAVIOR_KEY, behavior);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "notification received" command to the service.
   *
   * @param context      Context where to start the service.
   * @param notification Notification received
   */
  public static void enqueueReceive(Context context, Notification notification) {
    enqueueReceive(context, notification, null);
  }

  /**
   * A helper function for dispatching a "notification received" command to the service.
   *
   * @param context      Context where to start the service.
   * @param notification Notification received
   * @param receiver     Result receiver
   */
  public static void enqueueReceive(Context context, Notification notification, ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath("receive").build());
    intent.putExtra(EVENT_TYPE_KEY, RECEIVE_TYPE);
    intent.putExtra(NOTIFICATION_KEY, notification);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "dismiss notification" command to the service.
   *
   * @param context    Context where to start the service.
   * @param identifier Notification identifier
   */
  public static void enqueueDismiss(Context context, @NonNull String identifier, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(identifier).appendPath("dismiss").build());
    intent.putExtra(EVENT_TYPE_KEY, DISMISS_TYPE);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "dismiss selected notification" command to the service.
   *
   * @param context     Context where to start the service.
   * @param identifiers Notification identifiers
   */
  public static void enqueueDismissSelected(Context context, @NonNull String[] identifiers, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DISMISS_SELECTED_TYPE);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifiers);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "dismiss all notifications" command to the service.
   *
   * @param context Context where to start the service.
   */
  public static void enqueueDismissAll(Context context, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DISMISS_ALL_TYPE);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "notification response received" command to the service.
   *
   * @param context  Context where to start the service
   * @param response Notification response received
   */
  public static void enqueueResponseReceived(Context context, NotificationResponse response) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(response.getNotification().getNotificationRequest().getIdentifier()).appendPath("receive").build());
    intent.putExtra(EVENT_TYPE_KEY, RESPONSE_TYPE);
    intent.putExtra(NOTIFICATION_RESPONSE_KEY, response);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "notifications dropped" command to the service.
   *
   * @param context Context where to start the service.
   */
  public static void enqueueDropped(Context context) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DROPPED_TYPE);
    enqueueWork(context, intent);
  }

  /**
   * Sends the intent to the best service to handle the {@link #NOTIFICATION_EVENT_ACTION} intent.
   *
   * @param context Context where to start the service
   * @param intent  Intent to dispatch
   */
  private static void enqueueWork(Context context, Intent intent) {
    Intent searchIntent = new Intent(NOTIFICATION_EVENT_ACTION).setPackage(context.getPackageName());
    ResolveInfo resolveInfo = context.getPackageManager().resolveService(searchIntent, 0);
    if (resolveInfo == null || resolveInfo.serviceInfo == null) {
      Log.e("expo-notifications", String.format("No service capable of handling notifications found (intent = %s). Ensure that you have configured your AndroidManifest.xml properly.", NOTIFICATION_EVENT_ACTION));
      return;
    }
    ComponentName component = new ComponentName(resolveInfo.serviceInfo.packageName, resolveInfo.serviceInfo.name);
    intent.setComponent(component);
    context.startService(intent);
  }

  protected static Uri.Builder getUriBuilder() {
    return Uri.parse("expo-notifications://notifications/").buildUpon();
  }

  protected static Uri.Builder getUriBuilderForIdentifier(String identifier) {
    return getUriBuilder().appendPath(identifier);
  }
}
