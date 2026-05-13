package expo.modules.notifications.notifications.interfaces

import expo.modules.notifications.service.delegates.SharedPreferencesNotificationsStore
import java.io.Serializable
import java.util.Date

/**
 * A notification trigger that is serializable - this ensures [SharedPreferencesNotificationsStore]
 * is capable of storing it in the device's memory.
 */
interface SchedulableNotificationTrigger : NotificationTrigger, Serializable {
  /**
   * @return Next date at which the notification should be triggered. Returns `null`
   * if the notification will not trigger in the future (it can be removed then).
   */
  fun nextTriggerDate(): Date?
}
