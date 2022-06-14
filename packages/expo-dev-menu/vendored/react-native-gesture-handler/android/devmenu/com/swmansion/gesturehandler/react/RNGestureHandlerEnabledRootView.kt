package devmenu.com.swmansion.gesturehandler.react

import android.content.Context
import android.os.Bundle
import android.util.AttributeSet
import android.view.MotionEvent
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView

@Deprecated(message = "Use <GestureHandlerRootView /> component instead. Check gesture handler installation instructions in documentation for more information.")
class RNGestureHandlerEnabledRootView : ReactRootView {
  private lateinit var _reactInstanceManager: ReactInstanceManager
  private var gestureRootHelper: RNGestureHandlerRootHelper? = null

  constructor(context: Context?) : super(context) {}
  constructor(context: Context?, attrs: AttributeSet?) : super(context, attrs) {}

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    gestureRootHelper?.requestDisallowInterceptTouchEvent(disallowIntercept)
    super.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    return if (gestureRootHelper?.dispatchTouchEvent(ev) == true) {
      true
    } else super.dispatchTouchEvent(ev)
  }

  /**
   * This method is used to enable root view to start processing touch events through the gesture
   * handler library logic. Unless this method is called (which happens as a result of instantiating
   * new gesture handler from JS) the root view component will just proxy all touch related methods
   * to its superclass. Thus in the "disabled" state all touch related events will fallback to
   * default RN behavior.
   */
  fun initialize() {
    check(gestureRootHelper == null) { "GestureHandler already initialized for root view $this" }
    gestureRootHelper = RNGestureHandlerRootHelper(
      _reactInstanceManager.currentReactContext!!, this)
  }

  fun tearDown() {
    gestureRootHelper?.let {
      it.tearDown()
      gestureRootHelper = null
    }
  }

  override fun startReactApplication(
    reactInstanceManager: ReactInstanceManager,
    moduleName: String,
    initialProperties: Bundle?,
  ) {
    super.startReactApplication(reactInstanceManager, moduleName, initialProperties)
    _reactInstanceManager = reactInstanceManager
  }
}
