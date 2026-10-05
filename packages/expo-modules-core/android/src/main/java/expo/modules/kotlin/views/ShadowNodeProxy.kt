package expo.modules.kotlin.views

import android.os.Handler
import android.os.Looper
import android.os.Message
import android.view.ViewTreeObserver
import expo.modules.kotlin.jni.fabric.NativeStatePropsGetter
import java.lang.ref.WeakReference

class ShadowNodeProxy(expoView: ExpoView) {
  val weakExpoView = WeakReference(expoView)
  private val stateUpdater = NativeStatePropsGetter()

  private var pendingFlush: ((stateWrapper: Any) -> Unit)? = null
  private var preDrawListener: ViewTreeObserver.OnPreDrawListener? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private var flushPosted = false
  private val flushRunnable = Runnable {
    flushPosted = false
    drainPendingFlush()
  }

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

  /**
   * Reports where the native layout system drew this view inside its `Host`, in dp relative to the
   * `Host`'s origin.
   */
  fun setContentOrigin(x: Double, y: Double) {
    val view = weakExpoView.get() ?: return
    stateUpdater.setContentOrigin(view.id, x, y)
  }

  fun clearContentOrigin() {
    val view = weakExpoView.get() ?: return
    stateUpdater.clearContentOrigin(view.id)
  }

  private fun scheduleFlush(flush: (stateWrapper: Any) -> Unit) {
    pendingFlush = flush
    val view = weakExpoView.get() ?: return
    val observer = view.viewTreeObserver?.takeIf { it.isAlive }

    if (observer != null) {
      // Remove the previous attached listener
      preDrawListener?.let(observer::removeOnPreDrawListener)

      val listener = object : ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          preDrawListener = null
          // The view is attached while drawing, so this re-fetch returns the same
          // observer that is dispatching us. removeOnPreDrawListener throws on a dead
          // observer, hence the isAlive guard.
          weakExpoView.get()?.viewTreeObserver?.takeIf { it.isAlive }?.removeOnPreDrawListener(this)
          drainPendingFlush()
          return true
        }
      }
      preDrawListener = listener
      observer.addOnPreDrawListener(listener)
    }

    // Predraw listener do not get called for each keyboard transition event so we add a fallback flush to be called here
    // https://github.com/expo/expo/issues/47778
    // Async and posted once, so it still runs during animations.
    // https://github.com/expo/expo/issues/51034
    if (!flushPosted) {
      flushPosted = true
      if (view.isAttachedToWindow) {
        mainHandler.sendMessage(Message.obtain(mainHandler, flushRunnable).apply { isAsynchronous = true })
      } else {
        // `view.post` keeps the runnable until the view attaches.
        view.post(flushRunnable)
      }
    }
  }

  private fun drainPendingFlush() {
    val flushNow = pendingFlush ?: return
    pendingFlush = null
    weakExpoView.get()?.stateWrapper?.let { flushNow.invoke(it) }
  }
}
