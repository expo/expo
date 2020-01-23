package expo.modules.notifications.notifications.interfaces;

import android.app.Notification;

import org.json.JSONObject;

/**
 * An object capable of building a {@link Notification} based
 * on a {@link JSONObject} spec.
 */
public interface NotificationBuilder {
  /**
   * Pass in {@link JSONObject} based on which the notification should be based.
   *
   * @param notificationRequest {@link JSONObject} on which the notification should be based.
   * @return The same instance of {@link NotificationBuilder} updated with the remote message.
   */
  NotificationBuilder setNotificationRequest(JSONObject notificationRequest);

  /**
   * Builds the notification based on passed in data.
   *
   * @return Built notification.
   */
  Notification build();
}
