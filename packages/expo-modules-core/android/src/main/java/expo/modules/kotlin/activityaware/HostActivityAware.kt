package expo.modules.kotlin.activityaware

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.hostactivity.HostActivity
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * Similar to [androidx.activity.contextaware.ContextAware]
 *
 * A [HostActivityAware] class is associated with a [HostActivity] sometime after
 * the Activity is passed down to the [AppContext] in [AppContext.onHostResume].
 * By adding a [OnHostActivityAvailableListener] you can receive a callback for that event.
 * It works with every `androidx.activity.ComponentActivity` host.
 */
interface HostActivityAware {
  /**
   * Adds a listener waiting for the host Activity to become available.
   * If the host Activity is available when the listener is being added, it will be called immediately.
   */
  fun addOnHostActivityAvailableListener(listener: OnHostActivityAvailableListener)

  fun removeOnHostActivityAvailableListener(listener: OnHostActivityAvailableListener)
}

/**
 * Similar to [androidx.activity.contextaware.ContextAware] from `androidx.activity:activity-kts`
 *
 * Run [onHostActivityAvailable] when the [HostActivity] becomes available and resume with the result.
 *
 * If the host Activity is already available, [onHostActivityAvailable] will be called on the UI thread
 * right away. Otherwise, it will be called on the UI thread when the Activity becomes available.
 *
 * No matter how many times the Activity will become available, the callback would be called only once.
 */
suspend inline fun <R> HostActivityAware.withHostActivityAvailable(
  crossinline onHostActivityAvailable: (HostActivity) -> R
): R = suspendCancellableCoroutine { continuation ->
  val listener = object : OnHostActivityAvailableListener {
    override fun onHostActivityAvailable(hostActivity: HostActivity) {
      if (continuation.isActive) {
        removeOnHostActivityAvailableListener(this)
        continuation.resumeWith(runCatching { onHostActivityAvailable(hostActivity) })
      }
    }
  }
  addOnHostActivityAvailableListener(listener)
  continuation.invokeOnCancellation {
    removeOnHostActivityAvailableListener(listener)
  }
}
