package expo.modules.notifications.notifications.service

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import java.lang.ref.WeakReference

/**
 * A simple lifecycle observer that redirects information to a weak reference to NotificationsHelper
 */
class NotificationsHelperLifecycleObserver(helper: NotificationsHelper) : DefaultLifecycleObserver {
  private val helperReference = WeakReference(helper)

  override fun onResume(owner: LifecycleOwner) {
    helperReference.get()?.onResume()
  }

  override fun onPause(owner: LifecycleOwner) {
    helperReference.get()?.onPause()
  }
}
