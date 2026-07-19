package expo.modules.kotlin.activityaware

import androidx.annotation.UiThread
import androidx.appcompat.app.AppCompatActivity

/**
 * Similar to [androidx.activity.contextaware.OnContextAvailableListener]
 *
 * Listener for receiving a callback at the first moment a [AppCompatActivity] is made
 * available to the [AppCompatActivityAware] class.
 */
fun interface OnActivityAvailableListener {
  /**
   * This callback will be called on UI thread.
   */
  @UiThread
  fun onActivityAvailable(activity: AppCompatActivity)
}
