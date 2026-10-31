package expo.modules.kotlin.activityaware

import androidx.activity.ComponentActivity
import expo.modules.kotlin.hostactivity.HostActivity
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Similar to [androidx.activity.contextaware.ContextAwareHelper]
 *
 * Helper class for implementing [HostActivityAware].
 */
class HostActivityAwareHelper : HostActivityAware {
  val listeners = CopyOnWriteArrayList<OnHostActivityAvailableListener>()

  private var activityReference = WeakReference<ComponentActivity>(null)

  /**
   * The host Activity that was made available last, or null when there is none.
   */
  val currentHostActivity: HostActivity?
    get() = activityReference.get()?.let { HostActivity.from(it) }

  /**
   * Forgets the cached host Activity, so a listener added later waits for the next one.
   */
  fun clearHostActivity() {
    this.activityReference = WeakReference(null)
  }

  fun dispatchOnHostActivityAvailable(hostActivity: HostActivity) {
    this.activityReference = WeakReference(hostActivity.activity)

    hostActivity.activity.runOnUiThread {
      for (listener in listeners) {
        listener.onHostActivityAvailable(hostActivity)
      }
    }
  }

  // region HostActivityAware

  override fun addOnHostActivityAvailableListener(listener: OnHostActivityAvailableListener) {
    listeners.add(listener)
    currentHostActivity?.let { hostActivity ->
      hostActivity.activity.runOnUiThread {
        listener.onHostActivityAvailable(hostActivity)
      }
    }
  }

  override fun removeOnHostActivityAvailableListener(listener: OnHostActivityAvailableListener) {
    listeners.remove(listener)
  }

  // endregion
}
