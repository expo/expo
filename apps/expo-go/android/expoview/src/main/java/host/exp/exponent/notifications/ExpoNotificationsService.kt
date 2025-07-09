package host.exp.exponent.notifications

import android.content.Context
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.PresentationDelegate
import host.exp.exponent.notifications.delegates.ScopedExpoPresentationDelegate

class ExpoNotificationsService : NotificationsService() {
  override fun getPresentationDelegate(context: Context): PresentationDelegate =
    ScopedExpoPresentationDelegate(context)
}
