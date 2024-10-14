package expo.modules.notifications.notifications.interfaces

import android.os.Bundle
import android.os.Parcelable

/**
 * An interface specifying source of the notification, to be implemented
 * by concrete classes.
 */
interface NotificationTrigger : Parcelable {
  // these are functions so that we're absolutely sure @Parcelize doesn't try to parcelize them
  // (as opposed to if they were properties)

  fun getNotificationChannel(): String? {
    return null
  }

  fun toBundle(): Bundle
}
