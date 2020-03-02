package expo.modules.notifications.notifications.interfaces;

import android.app.Notification;

import org.json.JSONObject;

import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationContent;

/**
 * An object capable of building a {@link Notification} based
 * on a {@link NotificationContent} spec.
 */
public interface NotificationBuilder {
  /**
   * Pass in {@link JSONObject} based on which the notification should be based.
   *
   * @param content {@link NotificationContent} on which the notification should be based.
   * @return The same instance of {@link NotificationBuilder} updated with the remote message.
   */
  NotificationBuilder setNotificationContent(NotificationContent content);

  /**
   * Pass in a {@link NotificationBehavior} if you want to override the behavior
   * of the notification, i.e. whether it should show a heads-up alert, set badge, etc.
   *
   * @param behavior {@link NotificationBehavior} to which the presentation effect should conform.
   * @return The same instance of {@link NotificationBuilder} updated with the remote message.
   */
  NotificationBuilder setAllowedBehavior(NotificationBehavior behavior);

  /**
   * Builds the notification based on passed in data.
   *
   * @return Built notification.
   */
  Notification build();
}
