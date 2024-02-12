package versioned.host.exp.exponent.modules.api.safeareacontext

import android.content.Context
import android.util.Log
import android.view.View
import android.view.ViewTreeObserver
import com.facebook.react.bridge.Arguments
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.views.view.ReactViewGroup
import java.util.concurrent.locks.ReentrantLock
import kotlin.concurrent.withLock

private const val MAX_WAIT_TIME_NANO = 500000000L // 500ms

class SafeAreaView(context: Context?) :
    ReactViewGroup(context), ViewTreeObserver.OnPreDrawListener {
  private var mMode = SafeAreaViewMode.PADDING
  private var mInsets: EdgeInsets? = null
  private var mEdges: SafeAreaViewEdges? = null
  private var mProviderView: View? = null
  private var mStateWrapper: StateWrapper? = null

  fun getStateWrapper(): StateWrapper? {
    return mStateWrapper
  }

  fun setStateWrapper(stateWrapper: StateWrapper?) {
    mStateWrapper = stateWrapper
  }

  private fun updateInsets() {
    val insets = mInsets
    if (insets != null) {
      val edges =
          mEdges
              ?: SafeAreaViewEdges(
                  SafeAreaViewEdgeModes.ADDITIVE,
                  SafeAreaViewEdgeModes.ADDITIVE,
                  SafeAreaViewEdgeModes.ADDITIVE,
                  SafeAreaViewEdgeModes.ADDITIVE)
      val stateWrapper = getStateWrapper()
      if (stateWrapper != null) {
        val map = Arguments.createMap()
        map.putMap("insets", edgeInsetsToJsMap(insets))
        stateWrapper.updateState(map)
      } else {
        val localData = SafeAreaViewLocalData(insets = insets, mode = mMode, edges = edges)
        val reactContext = getReactContext(this)
        val uiManager = reactContext.getNativeModule(UIManagerModule::class.java)
        if (uiManager != null) {
          uiManager.setViewLocalData(id, localData)
          // Sadly there doesn't seem to be a way to properly dirty a yoga node from java, so if we
          // are in
          // the middle of a layout, we need to recompute it. There is also no way to know whether
          // we
          // are in the middle of a layout so always do it.
          reactContext.runOnNativeModulesQueueThread {
            uiManager.uiImplementation.dispatchViewUpdates(-1)
          }
          waitForReactLayout()
        }
      }
    }
  }

  private fun waitForReactLayout() {
    // Block the main thread until the native module thread is finished with
    // its current tasks. To do this we use the done boolean as a lock and enqueue
    // a task on the native modules thread. When the task runs we can unblock the
    // main thread. This should be safe as long as the native modules thread
    // does not block waiting on the main thread.
    var done = false
    val lock = ReentrantLock()
    val condition = lock.newCondition()
    val startTime = System.nanoTime()
    var waitTime = 0L
    getReactContext(this).runOnNativeModulesQueueThread {
      lock.withLock {
        if (!done) {
          done = true
          condition.signal()
        }
      }
    }
    lock.withLock {
      while (!done && waitTime < MAX_WAIT_TIME_NANO) {
        try {
          condition.awaitNanos(MAX_WAIT_TIME_NANO)
        } catch (ex: InterruptedException) {
          // In case of an interrupt just give up waiting.
          done = true
        }
        waitTime += System.nanoTime() - startTime
      }
    }
    // Timed out waiting.
    if (waitTime >= MAX_WAIT_TIME_NANO) {
      Log.w("SafeAreaView", "Timed out waiting for layout.")
    }
  }

  fun setMode(mode: SafeAreaViewMode) {
    mMode = mode
    updateInsets()
  }

  fun setEdges(edges: SafeAreaViewEdges) {
    mEdges = edges
    updateInsets()
  }

  private fun maybeUpdateInsets(): Boolean {
    val providerView = mProviderView ?: return false
    val edgeInsets = getSafeAreaInsets(providerView) ?: return false
    if (mInsets != edgeInsets) {
      mInsets = edgeInsets
      updateInsets()
      return true
    }
    return false
  }

  private fun findProvider(): View {
    var current = parent
    while (current != null) {
      if (current is SafeAreaProvider) {
        return current
      }
      current = current.parent
    }
    return this
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    mProviderView = findProvider()
    mProviderView?.viewTreeObserver?.addOnPreDrawListener(this)
    maybeUpdateInsets()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    mProviderView?.viewTreeObserver?.removeOnPreDrawListener(this)
    mProviderView = null
  }

  override fun onPreDraw(): Boolean {
    val didUpdate = maybeUpdateInsets()
    if (didUpdate) {
      requestLayout()
    }
    return !didUpdate
  }
}
