package expo.modules.notifications.notifications.interfaces;

import android.content.Context;

/**
 * Internal module capable of providing with new instances of {@link NotificationBuilder}s.
 * <p>
 * Overrideable in case developer wants to handle more settings data than the library does.
 */
public interface NotificationBuilderFactory {
  /**
   * Creates an instance of {@link NotificationBuilder}.
   *
   * @param context Context to be used by {@link NotificationBuilder}.
   * @return A new instance of {@link NotificationBuilder}.
   */
  NotificationBuilder createBuilder(Context context);
}
