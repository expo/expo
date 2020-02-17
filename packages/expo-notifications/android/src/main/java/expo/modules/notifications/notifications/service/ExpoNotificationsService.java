package expo.modules.notifications.notifications.service;

import android.app.Notification;

import org.json.JSONObject;

import androidx.core.app.NotificationManagerCompat;
import expo.modules.notifications.notifications.interfaces.NotificationBehavior;
import expo.modules.notifications.notifications.interfaces.NotificationBuilder;
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder;

/**
 * A notification service using {@link ExpoNotificationBuilder} to build notifications.
 * Capable of presenting the notifications to the user.
 */
public class ExpoNotificationsService extends BaseNotificationsService {
  /**
   * Callback called when the service is supposed to present a notification.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param behavior   Allowed notification behavior
   */
  protected void onNotificationPresent(String identifier, JSONObject request, NotificationBehavior behavior) {
    String tag = getNotificationTag(identifier, request);
    int id = getNotificationId(identifier, request);
    Notification notification = getNotification(request, behavior);
    NotificationManagerCompat.from(this).notify(tag, id, notification);
  }

  /**
   * @param identifier Notification identifier
   * @param request    Notification request
   * @return Tag to use to identify the notification.
   */
  protected String getNotificationTag(String identifier, JSONObject request) {
    return identifier;
  }

  /**
   * @param identifier Notification identifier
   * @param request    Notification request
   * @return A numeric identifier to use to identify the notification
   */
  protected int getNotificationId(String identifier, JSONObject request) {
    return 0;
  }

  protected NotificationBuilder getNotificationBuilder() {
    return new ExpoNotificationBuilder(this);
  }

  protected Notification getNotification(JSONObject request, NotificationBehavior behavior) {
    return getNotificationBuilder()
        .setNotificationRequest(request)
        .setAllowedBehavior(behavior)
        .build();
  }
}
