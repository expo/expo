package expo.modules.kotlin.activityaware

import androidx.appcompat.app.AppCompatActivity
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Similar to [androidx.activity.contextaware.ContextAwareHelper]
 *
 * Helper class for implementing [AppCompatActivityAware].
 */
class AppCompatActivityAwareHelper : AppCompatActivityAware {
  val listeners = CopyOnWriteArrayList<OnActivityAvailableListener>()

  private var activityReference = WeakReference<AppCompatActivity>(null)

  fun dispatchOnActivityAvailable(activity: AppCompatActivity) {
    this.activityReference = WeakReference(activity)

    activity.runOnUiThread {
      for (listener in listeners) {
        listener.onActivityAvailable(activity)
      }
    }
  }

  // region AppCompatActivityAware

  override fun addOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    listeners.add(listener)
    activityReference.get()?.let { activity ->
      activity.runOnUiThread {
        listener.onActivityAvailable(activity)
      }
    }
  }

  override fun removeOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    listeners.remove(listener)
  }

  // endregion
}
