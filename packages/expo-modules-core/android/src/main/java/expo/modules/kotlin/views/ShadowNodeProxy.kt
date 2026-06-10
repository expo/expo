package expo.modules.kotlin.views

import android.view.ViewTreeObserver
import expo.modules.kotlin.jni.fabric.NativeStatePropsGetter
import java.lang.ref.WeakReference

class ShadowNodeProxy(expoView: ExpoView) {
  val weakExpoView = WeakReference(expoView)
  private val stateUpdater = NativeStatePropsGetter()

  private var pendingFlush: ((stateWrapper: Any) -> Unit)? = null
  private var preDrawListener: ViewTreeObserver.OnPreDrawListener? = null

  // Schedule in predraw listener to avoid early return in re-entrancy
  // We have a proper fix [here](https://github.com/facebook/react-native/pull/56311)
  // but it needs to be merged in RN
  // TODO: Remove the workaround when RN PR gets merged.
  fun setViewSize(width: Double, height: Double) {
    scheduleFlush { stateWrapper ->
      stateUpdater.updateViewSizeImmediate(stateWrapper, width, height)
    }
  }

  fun setStyleSize(width: Double?, height: Double?) {
    scheduleFlush { stateWrapper ->
      stateUpdater.updateStyleSizeImmediate(stateWrapper, width ?: Double.NaN, height ?: Double.NaN)
    }
  }

  private fun scheduleFlush(flush: (stateWrapper: Any) -> Unit) {
    pendingFlush = flush
    val observer = weakExpoView.get()?.viewTreeObserver?.takeIf { it.isAlive } ?: return

    // Remove the previous attached listener
    preDrawListener?.let(observer::removeOnPreDrawListener)

    val listener = object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        preDrawListener = null
        // The view is attached while drawing, so this re-fetch returns the same
        // observer that is dispatching us. removeOnPreDrawListener throws on a dead
        // observer, hence the isAlive guard.
        weakExpoView.get()?.viewTreeObserver?.takeIf { it.isAlive }?.removeOnPreDrawListener(this)
        val flushNow = pendingFlush
        pendingFlush = null
        weakExpoView.get()?.stateWrapper?.let { flushNow?.invoke(it) }
        return true
      }
    }
    preDrawListener = listener
    observer.addOnPreDrawListener(listener)
  }
}
