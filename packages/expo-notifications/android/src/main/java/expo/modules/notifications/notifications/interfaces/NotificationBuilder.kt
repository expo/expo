package expo.modules.notifications.notifications.interfaces

import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.Notification

/**
 * An object capable of building a [Notification] based
 * on a [NotificationContent] spec.
 */
interface NotificationBuilder {
  /**
   * Pass in a [NotificationBehavior] if you want to override the behavior
   * of the notification, i.e. whether it should show a heads-up alert, set badge, etc.
   *
   * @param behavior [NotificationBehavior] to which the presentation effect should conform.
   * @return The same instance of [NotificationBuilder] updated with the remote message.
   */
  fun setAllowedBehavior(behavior: NotificationBehaviorRecord?): NotificationBuilder

  /**
   * Builds the Android notification based on passed in data.
   *
   * @return Built notification.
   */
  suspend fun build(): android.app.Notification
}
