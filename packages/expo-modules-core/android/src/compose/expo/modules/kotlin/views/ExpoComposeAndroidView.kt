package expo.modules.kotlin.views

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.ViewUtil
import expo.modules.kotlin.AppContext

/**
 * Marks a view as capable of crossing the Jetpack Compose -> React Native boundary.
 */
interface RNHostViewInterface {
  var matchContents: Boolean
}

/**
 * A wrapper that implements [RootView] so that React Native views embedded in Compose
 * via [AndroidView] can resolve their root view for gesture handling.
 *
 * Without this, [com.facebook.react.uimanager.RootViewUtil.getRootView] fails with an
 * [AssertionError] because the parent chain through Compose's internal view hierarchy
 * reaches [android.view.ViewRootImpl] (not a [View]) before finding a [RootView].
 *
 * This wrapper also creates its own [JSTouchDispatcher] (and optionally [JSPointerDispatcher])
 * to forward touch events to JS, mirroring what ReactRootView does.
 */
private class ComposeRootViewWrapper(context: Context) : FrameLayout(context), RootView {
  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private val jsPointerDispatcher: JSPointerDispatcher? =
    if (ReactFeatureFlags.dispatchPointerEvents) JSPointerDispatcher(this) else null

  private fun getReactContext(): ReactContext? =
    try {
      UIManagerHelper.getReactContext(this)
    } catch (_: Exception) {
      null
    }

  private fun getEventDispatcher() =
    getReactContext()?.let { reactContext ->
      val child = getChildAt(0) ?: return@let null
      val uiManagerType = ViewUtil.getUIManagerType(child)
      UIManagerHelper.getEventDispatcher(reactContext, uiManagerType)
    }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    val reactContext = getReactContext()
    val eventDispatcher = getEventDispatcher()
    if (reactContext != null && eventDispatcher != null) {
      jsTouchDispatcher.handleTouchEvent(ev, eventDispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(ev, eventDispatcher, true)
    }
    return super.onInterceptTouchEvent(ev)
  }

  override fun onTouchEvent(ev: MotionEvent): Boolean {
    val reactContext = getReactContext()
    val eventDispatcher = getEventDispatcher()
    if (reactContext != null && eventDispatcher != null) {
      jsTouchDispatcher.handleTouchEvent(ev, eventDispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(ev, eventDispatcher, false)
    }
    super.onTouchEvent(ev)
    return true
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // Like ReactRootView: don't honor the request on ourselves (we always need
    // onInterceptTouchEvent to fire), but propagate up for Compose's benefit.
    parent?.requestDisallowInterceptTouchEvent(disallowIntercept)
  }

  @OptIn(UnstableReactNativeAPI::class)
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    val reactContext = getReactContext() ?: return
    val eventDispatcher = getEventDispatcher() ?: return
    jsTouchDispatcher.onChildStartedNativeGesture(ev, eventDispatcher, reactContext)
    if (childView != null) {
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, eventDispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    val eventDispatcher = getEventDispatcher() ?: return
    jsTouchDispatcher.onChildEndedNativeGesture(ev, eventDispatcher)
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun handleException(t: Throwable) {
    // Try to forward to the actual ReactRootView up the hierarchy
    var current: android.view.ViewParent? = parent
    while (current != null) {
      if (current is RootView) {
        current.handleException(t)
        return
      }
      current = if (current is View) (current as View).parent else null
    }
    throw t
  }
}

/**
 * An ExpoComposeView for [AndroidView] wrapping with existing view
 */
@SuppressLint("ViewConstructor")
internal class ExpoComposeAndroidView(
  private val view: View,
  appContext: AppContext
) : ExpoComposeView<ComposeProps>(view.context, appContext), RNHostViewInterface {
  override var matchContents = false

  @Composable
  override fun ComposableScope.Content() {
    val w = view.width.toFloat().pxToDp()
    val h = view.height.toFloat().pxToDp()
    AndroidView(
      factory = {
        // Detach from any existing parent (e.g. a previous AndroidViewHolder)
        // to avoid "The specified child already has a parent" when the
        // composition is recreated by a parent SubcomposeLayout.
        (view.parent as? ViewGroup)?.removeView(view)
        // Wrap in a RootView-implementing container so that React Native's
        // RootViewUtil.getRootView() can resolve the root for gesture handling.
        ComposeRootViewWrapper(view.context).apply {
          addView(view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        }
      },
      modifier = Modifier.size(w.dp, h.dp)
    )
  }
}
