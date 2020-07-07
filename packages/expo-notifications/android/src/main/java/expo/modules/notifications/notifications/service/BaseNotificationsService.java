package expo.modules.notifications.notifications.service;

import android.app.Service;
import android.content.Intent;
import android.os.Bundle;
import android.os.IBinder;
import android.os.ResultReceiver;
import android.util.Log;

import java.util.ArrayList;
import java.util.Collection;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationResponse;

import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.DISMISS_ALL_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.DISMISS_SELECTED_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.DISMISS_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.DROPPED_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.EVENT_TYPE_KEY;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.GET_ALL_DISPLAYED;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.NOTIFICATION_BEHAVIOR_KEY;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.NOTIFICATION_EVENT_ACTION;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.NOTIFICATION_IDENTIFIER_KEY;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.NOTIFICATION_KEY;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.NOTIFICATION_RESPONSE_KEY;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.PRESENT_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.RECEIVER_KEY;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.RECEIVE_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.RESPONSE_TYPE;
import static expo.modules.notifications.notifications.service.BaseNotificationsHelper.SUCCESS_CODE;

public class BaseNotificationsService extends Service {

  public static final String EXCEPTION_KEY = "exception";
  public static final String NOTIFICATIONS_KEY = "notifications";

  public static final int EXCEPTION_OCCURRED_CODE = -1;

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    ResultReceiver receiver = intent.getParcelableExtra(RECEIVER_KEY);

    if (intent != null) {
      try {
        // Invalid action provided
        if (!NOTIFICATION_EVENT_ACTION.equals(intent.getAction())) {
          throw new IllegalArgumentException(String.format("Received intent of unrecognized action: %s. Ignoring.", intent.getAction()));
        }

        Bundle resultData = null;
        // Let's go through known actions and trigger respective callbacks
        String eventType = intent.getStringExtra(EVENT_TYPE_KEY);
        if (PRESENT_TYPE.equals(eventType)) {
          onNotificationPresent(
            intent.getParcelableExtra(NOTIFICATION_KEY),
            intent.getParcelableExtra(NOTIFICATION_BEHAVIOR_KEY)
          );
        } else if (RECEIVE_TYPE.equals(eventType)) {
          onNotificationReceived(intent.getParcelableExtra(NOTIFICATION_KEY));
        } else if (DISMISS_TYPE.equals(eventType)) {
          onNotificationDismiss(intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
        } else if (DISMISS_SELECTED_TYPE.equals(eventType)) {
          String[] identifiers = intent.getStringArrayExtra(NOTIFICATION_IDENTIFIER_KEY);
          for (String identifier : identifiers) {
            onNotificationDismiss(identifier);
          }
        } else if (DISMISS_ALL_TYPE.equals(eventType)) {
          onDismissAllNotifications();
        } else if (DROPPED_TYPE.equals(eventType)) {
          onNotificationsDropped();
        } else if (RESPONSE_TYPE.equals(eventType)) {
          onNotificationResponseReceived(intent.<NotificationResponse>getParcelableExtra(NOTIFICATION_RESPONSE_KEY));
        } else if (GET_ALL_DISPLAYED.equals(eventType)) {
          Bundle bundle = new Bundle();
          bundle.putParcelableArrayList(NOTIFICATIONS_KEY, new ArrayList<>(getDisplayedNotifications()));
          resultData = bundle;
        } else {
          throw new IllegalArgumentException(String.format("Received event of unrecognized type: %s. Ignoring.", intent.getAction()));
        }

        // If we ended up here, the callbacks must have completed successfully
        if (receiver != null) {
          receiver.send(SUCCESS_CODE, resultData);
        }
      } catch (IllegalArgumentException | NullPointerException e) {
        Log.e("expo-notifications", String.format("Action %s failed: %s.", intent.getAction(), e.getMessage()));
        e.printStackTrace();

        if (receiver != null) {
          Bundle bundle = new Bundle();
          bundle.putSerializable(EXCEPTION_KEY, e);
          receiver.send(EXCEPTION_OCCURRED_CODE, bundle);
        }
      }
    }
    stopSelf();
    return START_STICKY;
  }

  /**
   * Callback called when the service is supposed to present a notification.
   *
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   */
  protected void onNotificationPresent(Notification notification, NotificationBehavior behavior) {
  }

  /**
   * Callback called when the notifications system is informed of a new notification.
   *
   * @param notification Notification received
   */
  protected void onNotificationReceived(Notification notification) {
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
   * Callback called when the notifications system is informed of a new notification response.
   *
   * @param response Notification response received
   */
  protected void onNotificationResponseReceived(NotificationResponse response) {
  }

  /**
   * Callback called when some notifications dispatched by the backend haven't been delivered to the device.
   */
  protected void onNotificationsDropped() {
  }

  /**
   * Callback called when the notifications system is supposed to return a list of currently displayed
   * notifications.
   *
   * @return A list of currently displayed notifications,
   */
  protected Collection<Notification> getDisplayedNotifications() {
    return null;
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }
}
