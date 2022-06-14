package devmenu.com.swmansion.gesturehandler.react

import android.os.SystemClock
import android.util.Log
import android.view.MotionEvent
import android.view.ViewGroup
import android.view.ViewParent
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.RootView
import com.facebook.react.views.modal.ReactModalHostView
import devmenu.com.swmansion.gesturehandler.GestureHandler
import devmenu.com.swmansion.gesturehandler.GestureHandlerOrchestrator

class RNGestureHandlerRootHelper(private val context: ReactContext, wrappedView: ViewGroup) {
  private val orchestrator: GestureHandlerOrchestrator?
  private val jsGestureHandler: GestureHandler<*>?
  val rootView: ViewGroup
  private var shouldIntercept = false
  private var passingTouch = false

  init {
    UiThreadUtil.assertOnUiThread()
    val wrappedViewTag = wrappedView.id
    check(wrappedViewTag >= 1) { "Expect view tag to be set for $wrappedView" }
    val module = context.getNativeModule(RNGestureHandlerModule::class.java)!!
    val registry = module.registry
    rootView = findRootViewTag(wrappedView)
    Log.i(
      ReactConstants.TAG,
      "[GESTURE HANDLER] Initialize gesture handler for root view $rootView")
    orchestrator = GestureHandlerOrchestrator(
      wrappedView, registry, RNViewConfigurationHelper()).apply {
      minimumAlphaForTraversal = MIN_ALPHA_FOR_TOUCH
    }
    jsGestureHandler = RootViewGestureHandler().apply { tag = -wrappedViewTag }
    with(registry) {
      registerHandler(jsGestureHandler)
      attachHandlerToView(jsGestureHandler.tag, wrappedViewTag)
    }
    module.registerRootHelper(this)
  }

  fun tearDown() {
    Log.i(
      ReactConstants.TAG,
      "[GESTURE HANDLER] Tearing down gesture handler registered for root view $rootView")
    val module = context.getNativeModule(RNGestureHandlerModule::class.java)!!
    with(module) {
      registry.dropHandler(jsGestureHandler!!.tag)
      unregisterRootHelper(this@RNGestureHandlerRootHelper)
    }
  }

  private inner class RootViewGestureHandler : GestureHandler<RootViewGestureHandler>() {
    override fun onHandle(event: MotionEvent) {
      val currentState = state
      if (currentState == STATE_UNDETERMINED) {
        begin()
        shouldIntercept = false
      }
      if (event.actionMasked == MotionEvent.ACTION_UP) {
        end()
      }
    }

    override fun onCancel() {
      shouldIntercept = true
      val time = SystemClock.uptimeMillis()
      val event = MotionEvent.obtain(time, time, MotionEvent.ACTION_CANCEL, 0f, 0f, 0).apply {
        action = MotionEvent.ACTION_CANCEL
      }
      if (rootView is RootView) {
        rootView.onChildStartedNativeGesture(event)
      }
    }
  }

  fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // If this method gets called it means that some native view is attempting to grab lock for
    // touch event delivery. In that case we cancel all gesture recognizers
    if (orchestrator != null && !passingTouch) {
      // if we are in the process of delivering touch events via GH orchestrator, we don't want to
      // treat it as a native gesture capturing the lock
      tryCancelAllHandlers()
    }
  }

  fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    // We mark `mPassingTouch` before we get into `mOrchestrator.onTouchEvent` so that we can tell
    // if `requestDisallow` has been called as a result of a normal gesture handling process or
    // as a result of one of the gesture handlers activating
    passingTouch = true
    orchestrator!!.onTouchEvent(ev)
    passingTouch = false
    return shouldIntercept
  }

  private fun tryCancelAllHandlers() {
    // In order to cancel handlers we activate handler that is hooked to the root view
    jsGestureHandler?.apply {
      if (state == GestureHandler.STATE_BEGAN) {
        // Try activate main JS handler
        activate()
        end()
      }
    }
  }

  /*package*/
  fun handleSetJSResponder(viewTag: Int, blockNativeResponder: Boolean) {
    if (blockNativeResponder) {
      UiThreadUtil.runOnUiThread { tryCancelAllHandlers() }
    }
  }

  companion object {
    private const val MIN_ALPHA_FOR_TOUCH = 0.1f
    private fun findRootViewTag(viewGroup: ViewGroup): ViewGroup {
      UiThreadUtil.assertOnUiThread()
      var parent: ViewParent? = viewGroup
      while (parent != null && parent !is RootView) {
        parent = parent.parent
      }
      checkNotNull(parent) {
        "View $viewGroup has not been mounted under ReactRootView"
      }
      return parent as ViewGroup
    }
  }
}
