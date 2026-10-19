package expo.modules.kotlin.hostactivity

import android.app.Activity
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedDispatcher
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.exception.Exceptions

/**
 * The Activity that hosts the React instance, as seen by Expo modules.
 *
 * Expo supports every `androidx.activity.ComponentActivity`.
 * A `FragmentActivity` host, which includes `AppCompatActivity` and `ReactActivity`, is a [FragmentHostActivity].
 * Any other `ComponentActivity`, such as a Compose Activity, is a [ComponentHostActivity].
 *
 * Create it with [from].
 * It is bound to one Activity instance, so do not keep it across Activity recreation.
 */
sealed class HostActivity(val activity: ComponentActivity) {
  val lifecycleOwner: LifecycleOwner
    get() = activity

  val onBackPressedDispatcher: OnBackPressedDispatcher
    get() = activity.onBackPressedDispatcher

  /**
   * The support fragment manager of the host, or null when the host does not extend `FragmentActivity`.
   */
  abstract val fragmentManager: FragmentManager?

  companion object {
    /**
     * Wraps [activity].
     * Throws [Exceptions.UnsupportedHostActivity] when it does not extend `ComponentActivity`.
     */
    fun from(activity: Activity): HostActivity =
      fromOrNull(activity) ?: throw Exceptions.UnsupportedHostActivity(activity, ComponentActivity::class.java)

    /**
     * Wraps [activity], or returns null when it does not extend `ComponentActivity`.
     */
    fun fromOrNull(activity: Activity): HostActivity? = when (activity) {
      is FragmentActivity -> FragmentHostActivity(activity)
      is ComponentActivity -> ComponentHostActivity(activity)
      else -> null
    }
  }
}

class FragmentHostActivity(val fragmentActivity: FragmentActivity) : HostActivity(fragmentActivity) {
  override val fragmentManager: FragmentManager
    get() = fragmentActivity.supportFragmentManager
}

class ComponentHostActivity(activity: ComponentActivity) : HostActivity(activity) {
  override val fragmentManager: FragmentManager?
    get() = null
}
