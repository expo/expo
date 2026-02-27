package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.viewinterop.AndroidView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView

internal data class RNHostProps(
  val matchContents: MutableState<Boolean?> = mutableStateOf(null)
) : ComposeProps

@SuppressLint("ViewConstructor")
internal class RNHostView(context: Context, appContext: AppContext) :
  ExpoComposeView<RNHostProps>(context, appContext) {
  override val props = RNHostProps()

  private var childView: View? = null

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    if (child is androidx.compose.ui.platform.ComposeView) {
      super.addView(child, index, params)
      return
    }
    // Store reference only — the child will be parented by TouchRootWrapper
    // inside Compose's AndroidView, not by this LinearLayout.
    childView = child
  }

  @Composable
  override fun ComposableScope.Content() {
    val matchContents = props.matchContents.value ?: false
    val density = LocalDensity.current

    val sizeModifier = Modifier.onSizeChanged { size ->
      with(density) {
        val widthDp = size.width.toDp().value.toDouble()
        val heightDp = size.height.toDp().value.toDouble()
        if (matchContents) {
          shadowNodeProxy.setStyleSize(widthDp, heightDp)
        } else {
          shadowNodeProxy.setViewSize(widthDp, heightDp)
        }
      }
    }

    if (matchContents) {
      childView?.let { view ->
        // Seed with the child's current Yoga-set dimensions so requiredSize
        // is applied from the very first composition
        val childSize = remember {
          mutableStateOf(
            if (view.width > 0 && view.height > 0) IntSize(view.width, view.height)
            else IntSize.Zero
          )
        }

        DisposableEffect(view) {
          // Observe the child's Yoga-set dimensions reactively.
          // When Yoga re-layouts the child, the listener fires, updating Compose state,
          // which triggers recomposition with the correct requiredSize.
          val listener = View.OnLayoutChangeListener { _, l, t, r, b, _, _, _, _ ->
            childSize.value = IntSize(r - l, b - t)
          }
          view.addOnLayoutChangeListener(listener)
          onDispose { view.removeOnLayoutChangeListener(listener) }
        }

        val yogaSizeModifier = with(density) {
          if (childSize.value.width > 0 && childSize.value.height > 0) {
            Modifier.requiredSize(
              childSize.value.width.toDp(),
              childSize.value.height.toDp()
            )
          } else {
            Modifier
          }
        }

        AndroidView(
          factory = { ctx ->
            (view.parent as? ViewGroup)?.removeView(view)
            TouchRootWrapper(ctx, appContext).also { it.addView(view) }
          },
          modifier = yogaSizeModifier.then(sizeModifier)
        )
      }
    } else {
      // so the children with flex: 1 can expand.
      childView?.let { view ->
        AndroidView(
          factory = { ctx ->
            (view.parent as? ViewGroup)?.removeView(view)
            TouchRootWrapper(ctx, appContext).also { it.addView(view) }
          },
          modifier = Modifier.fillMaxSize().then(sizeModifier)
        )
      }
    }
  }
}

/**
 * A wrapper that implements [RootView] so that touch events from React Native
 * children are dispatched to JS. This is essential in detached windows
 * (e.g. ModalBottomSheet dialog) where ReactRootView's touch handlers can't reach.
 * Follows the same pattern as React Native's DialogRootViewGroup used by Modal.
 */
@SuppressLint("ViewConstructor")
private class TouchRootWrapper(
  context: Context,
  private val appContext: AppContext
) : FrameLayout(context), RootView {

  private val jsTouchDispatcher: JSTouchDispatcher = JSTouchDispatcher(this)
  private val jsPointerDispatcher: JSPointerDispatcher? =
    if (ReactFeatureFlags.dispatchPointerEvents) JSPointerDispatcher(this) else null
  private var eventDispatcher: EventDispatcher? = null

  private val reactContext: ReactContext?
    get() = appContext.reactContext as? ReactContext

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    val ctx = reactContext ?: return
    val childView = getChildAt(0) ?: return
    eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(ctx, childView.id)
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    eventDispatcher = null
  }

  override fun onInterceptTouchEvent(ev: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(ev, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(ev, dispatcher, true)
    }
    return super.onInterceptTouchEvent(ev)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(ev: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(ev, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(ev, dispatcher, false)
    }
    super.onTouchEvent(ev)
    return true
  }

  override fun onInterceptHoverEvent(ev: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(ev, it, true) }
    return super.onHoverEvent(ev)
  }

  override fun onHoverEvent(ev: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(ev, it, false) }
    return super.onHoverEvent(ev)
  }

  @OptIn(com.facebook.react.common.annotations.UnstableReactNativeAPI::class)
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildStartedNativeGesture(ev, dispatcher, reactContext)
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, dispatcher)
    }
  }

  @Suppress("DEPRECATION")
  override fun onChildStartedNativeGesture(ev: MotionEvent) {
    onChildStartedNativeGesture(null, ev)
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jsTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // No-op — must keep receiving events to dispatch to JS.
  }

  override fun handleException(t: Throwable) {
    reactContext?.handleException(RuntimeException(t))
  }
}
