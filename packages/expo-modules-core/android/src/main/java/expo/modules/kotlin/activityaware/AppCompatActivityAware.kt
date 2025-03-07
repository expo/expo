package expo.modules.kotlin.activityaware

import android.app.Activity
import androidx.appcompat.app.AppCompatActivity
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * Similar to [androidx.activity.contextaware.ContextAware]
 *
 * A [AppCompatActivityAware] class is associated with a [AppCompatActivity] sometime after
 * the [Activity] is passed down to the [AppContext] in [AppContext.onHostResume].
 * By adding a [OnActivityAvailableListener] you can receive a callback for that event.
 */
interface AppCompatActivityAware {
  /**
   * Adds a listener waiting for Activity to become available.
   * If Activity is available when listener is being added it will be immediately called.
   */
  fun addOnActivityAvailableListener(listener: OnActivityAvailableListener)

  fun removeOnActivityAvailableListener(listener: OnActivityAvailableListener)
}

/**
 * Similar to [androidx.activity.contextaware.ContextAware] from `androidx.activity:activity-kts`
 *
 * Run [onActivityAvailable] when the [AppCompatActivity] becomes available and resume with the result.
 *
 * If the [AppCompatActivity] is already available, [onActivityAvailable] will be synchronously
 * called on the current coroutine context. Otherwise, [onActivityAvailable] will be called on the
 * the UI thread immediately when the [Activity] becomes available.
 *
 * No matter how many times [Activity] will become available callback would be called only once.
 */
suspend inline fun <R> AppCompatActivityAware.withActivityAvailable(
  crossinline onActivityAvailable: (AppCompatActivity) -> R
): R = suspendCancellableCoroutine { continuation ->
  val listener = object : OnActivityAvailableListener {
    override fun onActivityAvailable(activity: AppCompatActivity) {
      if (continuation.isActive) {
        removeOnActivityAvailableListener(this)
        continuation.resumeWith(runCatching { onActivityAvailable(activity) })
      }
    }
  }
  addOnActivityAvailableListener(listener)
  continuation.invokeOnCancellation {
    removeOnActivityAvailableListener(listener)
  }
}
