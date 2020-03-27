package expo.modules.notifications.notifications.interfaces;

import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationContent;

/**
 * An object capable of building a {@link Notification} based
 * on a {@link NotificationContent} spec.
 */
public interface NotificationBuilder {
  /**
   * Pass in a {@link Notification} based on which the Android notification should be based.
   *
   * @param notification {@link Notification} on which the notification should be based.
   * @return The same instance of {@link NotificationBuilder} updated with the notification.
   */
  NotificationBuilder setNotification(Notification notification);

  /**
   * Pass in a {@link NotificationBehavior} if you want to override the behavior
   * of the notification, i.e. whether it should show a heads-up alert, set badge, etc.
   *
   * @param behavior {@link NotificationBehavior} to which the presentation effect should conform.
   * @return The same instance of {@link NotificationBuilder} updated with the remote message.
   */
  NotificationBuilder setAllowedBehavior(NotificationBehavior behavior);

  /**
   * Builds the Android notification based on passed in data.
   *
   * @return Built notification.
   */
  android.app.Notification build();
}
