package expo.modules.kotlin.views

import android.view.ViewTreeObserver
import expo.modules.kotlin.jni.fabric.NativeStatePropsGetter
import java.lang.ref.WeakReference

class ShadowNodeProxy(expoView: ExpoView) {
  val weakExpoView = WeakReference(expoView)
  private val stateUpdater = NativeStatePropsGetter()

  private var pendingFlush: ((stateWrapper: Any) -> Unit)? = null
  private var preDrawListener: ViewTreeObserver.OnPreDrawListener? = null

  // Shecule in predraw listener to avoid early return in re-entrancy 
  // We have a proper fix [here](https://github.com/facebook/react-native/pull/56311) 
  // but it needs to be merged in RN
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
    val expoView = weakExpoView.get() ?: return
    pendingFlush = flush

    if (preDrawListener != null) {
      return
    }

    val listener = object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        removePreDrawListener()
        val flushNow = pendingFlush
        pendingFlush = null
        weakExpoView.get()?.stateWrapper?.let { flushNow?.invoke(it) }
        return true
      }
    }
    preDrawListener = listener
    expoView.viewTreeObserver.addOnPreDrawListener(listener)
  }

  private fun removePreDrawListener() {
    val listener = preDrawListener ?: return
    preDrawListener = null
    val observer = weakExpoView.get()?.viewTreeObserver
    if (observer != null && observer.isAlive) {
      observer.removeOnPreDrawListener(listener)
    }
  }
}
