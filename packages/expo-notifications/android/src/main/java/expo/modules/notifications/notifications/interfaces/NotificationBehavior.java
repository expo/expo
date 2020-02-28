package expo.modules.notifications.notifications.interfaces;

import android.os.Parcelable;

import androidx.annotation.Nullable;

/**
 * Interface representing behavior which should be applied
 * to a notification.
 */
public interface NotificationBehavior extends Parcelable {
  /**
   * @return Priority which should be assigned to the notification.
   */
  @Nullable
  String getPriorityOverride();

  /**
   * @return Whether to show a heads-up alert.
   */
  boolean shouldShowAlert();

  /**
   * @return Whether the notification should be accompanied by a sound.
   */
  boolean shouldPlaySound();

  /**
   * @return Whether badge count that may be contained in the notification should be applied.
   */
  boolean shouldSetBadge();
}
