package expo.modules.notifications.notifications.service;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.ResultReceiver;
import android.util.Log;

import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.UUID;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.JobIntentService;
import expo.modules.notifications.notifications.interfaces.NotificationBehavior;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.triggers.FirebaseNotificationTrigger;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public abstract class BaseNotificationsService extends JobIntentService {
  public static final String NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT";

  // Known result codes
  public static final int SUCCESS_CODE = 0;
  public static final int EXCEPTION_OCCURRED_CODE = -1;
  public static final String EXCEPTION_KEY = "exception";

  // Intent extras keys
  private static final String NOTIFICATION_IDENTIFIER_KEY = "id";
  private static final String NOTIFICATION_REQUEST_KEY = "request";
  private static final String NOTIFICATION_BEHAVIOR_KEY = "behavior";
  private static final String NOTIFICATION_TRIGGER_KEY = "trigger";
  private static final String EVENT_TYPE_KEY = "type";
  private static final String RECEIVER_KEY = "receiver";

  private static final String PRESENT_TYPE = "present";
  private static final String DISMISS_TYPE = "dismiss";
  private static final String DISMISS_ALL_TYPE = "dismissAll";
  private static final String RECEIVE_TYPE = "receive";
  private static final String DROPPED_TYPE = "dropped";

  private static final Intent SEARCH_INTENT = new Intent(NOTIFICATION_EVENT_ACTION);
  private static final int JOB_ID = BaseNotificationsService.class.getName().hashCode();

  /**
   * A helper function for dispatching a "present notification" command to the service.
   *
   * @param context      Context where to start the service.
   * @param identifier   Identifier of the notification.
   * @param notification Notification request
   * @param behavior     Allowed notification behavior
   * @param receiver     A receiver to which send the result of presenting the notification
   */
  public static void enqueuePresent(Context context, @NonNull String identifier, @NonNull JSONObject notification, @Nullable NotificationBehavior behavior, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(identifier).appendPath("present").build());
    intent.putExtra(EVENT_TYPE_KEY, PRESENT_TYPE);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(NOTIFICATION_REQUEST_KEY, notification.toString());
    intent.putExtra(NOTIFICATION_BEHAVIOR_KEY, behavior);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "RemoteMessage received" command to the service.
   *
   * @param context       Context where to start the service.
   * @param remoteMessage Received remote message.
   */
  public static void enqueueReceive(Context context, @NonNull RemoteMessage remoteMessage) {
    String identifier = remoteMessage.getMessageId();
    if (identifier == null) {
      identifier = UUID.randomUUID().toString();
    }
    enqueueReceive(context, identifier, new JSONObject(remoteMessage.getData()), new FirebaseNotificationTrigger(remoteMessage));
  }

  /**
   * A helper function for dispatching a "notification received" command to the service.
   *
   * @param context      Context where to start the service.
   * @param identifier   Notification identifier
   * @param notification Notification request
   * @param trigger      Notification trigger
   */
  public static void enqueueReceive(Context context, @NonNull String identifier, @NonNull JSONObject notification, @Nullable NotificationTrigger trigger) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(identifier).appendPath("receive").build());
    intent.putExtra(EVENT_TYPE_KEY, RECEIVE_TYPE);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(NOTIFICATION_REQUEST_KEY, notification.toString());
    intent.putExtra(NOTIFICATION_TRIGGER_KEY, trigger);
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
    ResolveInfo resolveInfo = context.getPackageManager().resolveService(SEARCH_INTENT, 0);
    if (resolveInfo == null || resolveInfo.serviceInfo == null) {
      Log.e("expo-notifications", String.format("No service capable of handling notifications found (intent = %s). Ensure that you have configured your AndroidManifest.xml properly.", NOTIFICATION_EVENT_ACTION));
      return;
    }
    ComponentName component = new ComponentName(resolveInfo.serviceInfo.packageName, resolveInfo.serviceInfo.name);
    enqueueWork(context, component, JOB_ID, intent);
  }

  @Override
  protected void onHandleWork(@NonNull Intent intent) {
    ResultReceiver receiver = intent.getParcelableExtra(RECEIVER_KEY);
    try {
      // Invalid action provided
      if (!NOTIFICATION_EVENT_ACTION.equals(intent.getAction())) {
        throw new IllegalArgumentException(String.format("Received intent of unrecognized action: %s. Ignoring.", intent.getAction()));
      }

      // Let's go through known actions and trigger respective callbacks
      String eventType = intent.getStringExtra(EVENT_TYPE_KEY);
      if (PRESENT_TYPE.equals(eventType)) {
        onNotificationPresent(
            intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY),
            new JSONObject(intent.getStringExtra(NOTIFICATION_REQUEST_KEY)),
            // Removing <NotificationBehavior> produces a compile error /shrug
            intent.<NotificationBehavior>getParcelableExtra(NOTIFICATION_BEHAVIOR_KEY)
        );
      } else if (RECEIVE_TYPE.equals(eventType)) {
        onNotificationReceived(
            intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY),
            new JSONObject(intent.getStringExtra(NOTIFICATION_REQUEST_KEY)),
            intent.<NotificationTrigger>getParcelableExtra(NOTIFICATION_TRIGGER_KEY)
        );
      } else if (DISMISS_TYPE.equals(eventType)) {
        onNotificationDismiss(intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
      } else if (DISMISS_ALL_TYPE.equals(eventType)) {
        onDismissAllNotifications();
      } else if (DROPPED_TYPE.equals(eventType)) {
        onNotificationsDropped();
      } else {
        throw new IllegalArgumentException(String.format("Received event of unrecognized type: %s. Ignoring.", intent.getAction()));
      }

      // If we ended up here, the callbacks must have completed successfully
      if (receiver != null) {
        receiver.send(SUCCESS_CODE, null);
      }
    } catch (JSONException | IllegalArgumentException | NullPointerException e) {
      Log.e("expo-notifications", String.format("Action %s failed: %s.", intent.getAction(), e.getMessage()));
      e.printStackTrace();

      if (receiver != null) {
        Bundle bundle = new Bundle();
        bundle.putSerializable(EXCEPTION_KEY, e);
        receiver.send(EXCEPTION_OCCURRED_CODE, bundle);
      }
    }
  }

  /**
   * Callback called when the service is supposed to present a notification.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param behavior   Allowed notification behavior
   */
  protected void onNotificationPresent(String identifier, JSONObject request, NotificationBehavior behavior) {
  }

  /**
   * Callback called when the notifications system is informed of a new notification.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param trigger    Notification trigger
   */
  protected void onNotificationReceived(String identifier, JSONObject request, NotificationTrigger trigger) {
  }

  /**
   * Callback called when the service is supposed to dismiss a notification.
   *
   * @param identifier Notification identifier
   */
  protected void onNotificationDismiss(String identifier) {
  }

  /**
   * Callback called when the service is supposed to dismiss all notifications.
   */
  protected void onDismissAllNotifications() {
  }

  /**
   * Callback called when some notifications dispatched by the backend haven't been delivered to the device.
   */
  protected void onNotificationsDropped() {
  }

  protected static Uri.Builder getUriBuilderForIdentifier(String identifier) {
    return Uri.parse("expo-notifications://notifications/").buildUpon().appendPath(identifier);
  }
}
