package expo.modules.notifications

import android.content.Context
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.notifications.service.delegates.ExpoNotificationLifecycleListener

class NotificationsPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener?> {
    return listOf(
      ExpoNotificationLifecycleListener()
    )
  }
}
