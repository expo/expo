package expo.modules.notifications.notifications.interfaces;

import android.app.NotificationChannel;

/**
 * Interface to be implemented by a singleton module
 * responsible for proxying requests regarding {@link NotificationChannel}
 * between unimodules and the OS.
 */
public interface NotificationChannelsManager {
  /**
   * Returns a fallback notification channel - used whenever we can't
   * find any better channel to assign the notification to.
   *
   * @return Fallback {@link NotificationChannel}
   */
  NotificationChannel getFallbackNotificationChannel();
}
