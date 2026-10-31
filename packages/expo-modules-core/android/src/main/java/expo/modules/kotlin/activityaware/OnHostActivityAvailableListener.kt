package expo.modules.kotlin.activityaware

import androidx.annotation.UiThread
import expo.modules.kotlin.hostactivity.HostActivity

/**
 * Similar to [androidx.activity.contextaware.OnContextAvailableListener]
 *
 * Listener for receiving a callback at the first moment a [HostActivity] is made
 * available to the [HostActivityAware] class.
 */
fun interface OnHostActivityAvailableListener {
  /**
   * This callback will be called on UI thread.
   */
  @UiThread
  fun onHostActivityAvailable(hostActivity: HostActivity)
}
