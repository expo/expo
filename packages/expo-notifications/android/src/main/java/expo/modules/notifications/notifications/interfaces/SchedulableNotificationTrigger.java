package expo.modules.notifications.notifications.interfaces;

import java.io.Serializable;
import java.util.Date;

import androidx.annotation.Nullable;
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationsStore;

/**
 * A notification trigger that is serializable - this ensures {@link SharedPreferencesNotificationsStore}
 * is capable of storing it in the device's memory.
 */
public interface SchedulableNotificationTrigger extends NotificationTrigger, Serializable {
  /**
   * @return Next date at which the notification should be triggered. Returns `null`
   * if the notification will not trigger in the future (it can be removed then).
   */
  @Nullable
  Date nextTriggerDate();
}
