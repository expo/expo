package expo.modules.kotlin.activityaware

import androidx.appcompat.app.AppCompatActivity
import java.lang.ref.WeakReference
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Similar to [androidx.activity.contextaware.ContextAwareHelper]
 *
 * Helper class for implementing [AppCompatActivityAware].
 */
class AppCompatActivityAwareHelper {
  val listeners = CopyOnWriteArrayList<OnActivityAvailableListener>()

  var activity = WeakReference<AppCompatActivity>(null)

  fun peekAvailableActivity(): AppCompatActivity? {
    return activity.get()
  }

  fun addOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    val a = activity.get()
    if (a != null) {
      listener.onActivityAvailable(a)
    }
    listeners.add(listener)
  }

  fun removeOnActivityAvailableListener(listener: OnActivityAvailableListener) {
    listeners.remove(listener)
  }

  fun dispatchOnActivityAvailable(activity: AppCompatActivity) {
    this.activity = WeakReference(activity)

    activity.runOnUiThread {
      for (listener in listeners) {
        listener.onActivityAvailable(activity)
      }
    }
  }
}
