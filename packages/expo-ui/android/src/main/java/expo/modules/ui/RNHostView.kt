package expo.modules.ui

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
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
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.uimanager.JSPointerDispatcher
import com.facebook.react.uimanager.JSTouchDispatcher
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.OptimizedComposeProps

@OptimizedComposeProps
internal data class RNHostViewProps(
  val matchContents: MutableState<Boolean?> = mutableStateOf(null),
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@SuppressLint("ViewConstructor")
internal class RNHostView(context: Context, appContext: AppContext) :
  ExpoComposeView<RNHostViewProps>(context, appContext) {
  companion object {
    private const val TAG = "RNHostView"
  }

  override val props = RNHostViewProps()

  private val childViewState = mutableStateOf<View?>(null)
  private val wrapperState = mutableStateOf<TouchDispatchingRootViewGroup?>(null)

  override fun addView(child: View, index: Int, params: ViewGroup.LayoutParams) {
    childViewState.value = child
    val wrapper = TouchDispatchingRootViewGroup(child.context).apply {
      val reactContext = child.context as? ReactContext
      if (reactContext != null) {
        eventDispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, child.id)
      } else {
        Log.e(TAG, "RNHostView: child context is not a ReactContext, touch events will not be dispatched to JS")
      }
      addView(child, FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
    }
    wrapperState.value = wrapper
  }

  override fun removeView(view: View) {
    if (view == childViewState.value) {
      wrapperState.value?.removeView(view)
      childViewState.value = null
      wrapperState.value = null
    } else {
      super.removeView(view)
    }
  }

  override fun removeViewAt(index: Int) {
    childViewState.value?.let { child ->
      wrapperState.value?.removeView(child)
    }
    childViewState.value = null
    wrapperState.value = null
  }

  @Composable
  override fun ComposableScope.Content() {
    val matchContents = props.matchContents.value ?: false
    val scope: ComposableScope = this

    wrapperState.value?.let { wrapper ->
      val childView = childViewState.value ?: return@let
      val sizingModifier = if (matchContents) {
        applySizeFromYogaNodeModifier(childView)
      } else {
        Modifier
          .fillMaxSize()
          .then(reportSizeToYogaNodeModifier())
      }
      val modifiers = sizingModifier
        .then(ModifierRegistry.applyModifiers(props.modifiers, appContext, scope, globalEventDispatcher))

      AndroidView(
        factory = {
          (wrapper.parent as? ViewGroup)?.removeView(wrapper)
          wrapper
        },
        modifier = modifiers
      )
    }
  }

  // Sets Compose view size from Yoga node size
  // Listens yoga node size changes and updates the Compose view size
  @Composable
  private fun applySizeFromYogaNodeModifier(childView: View): Modifier {
    val density = LocalDensity.current

    val childSize = remember {
      mutableStateOf(
        if (childView.width > 0 && childView.height > 0) {
          IntSize(childView.width, childView.height)
        } else {
          IntSize.Zero
        }
      )
    }

    DisposableEffect(childView) {
      val listener = View.OnLayoutChangeListener { _, l, t, r, b, _, _, _, _ ->
        childSize.value = IntSize(r - l, b - t)
      }
      childView.addOnLayoutChangeListener(listener)
      onDispose { childView.removeOnLayoutChangeListener(listener) }
    }

    return with(density) {
      if (childSize.value.width > 0 && childSize.value.height > 0) {
        Modifier.requiredSize(
          childSize.value.width.toDp(),
          childSize.value.height.toDp()
        )
      } else {
        Modifier
      }
    }
  }

  // Sets Yoga node size from Compose view size
  // Listens Compose view size changes and updates the Yoga node size
  @Composable
  private fun reportSizeToYogaNodeModifier(): Modifier {
    val density = LocalDensity.current
    return Modifier.onSizeChanged { size ->
      with(density) {
        shadowNodeProxy.setViewSize(
          size.width.toDp().value.toDouble(),
          size.height.toDp().value.toDouble()
        )
      }
    }
  }
}

/**
 * A thin FrameLayout that intercepts touch events and dispatches them to JS via
 * JSTouchDispatcher/JSPointerDispatcher, replicating the pattern from React Native's
 * DialogRootViewGroup in ReactModalHostView.
 */
private class TouchDispatchingRootViewGroup(
  context: Context
) : FrameLayout(context), RootView {
  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null

  var eventDispatcher: EventDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jsPointerDispatcher = JSPointerDispatcher(this)
    }
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    // Always gets called with EXACTLY mode
    // because parent has either fillMaxSize (matchContents = false) or requiredSize (matchContents = true) modifiers
    setMeasuredDimension(
      MeasureSpec.getSize(widthMeasureSpec),
      MeasureSpec.getSize(heightMeasureSpec)
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    // No-op: don't re-layout children. Yoga calls child.layout() directly
    // and we must not override those values.
  }

  override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, true)
    }
    return super.onInterceptTouchEvent(event)
  }

  @SuppressLint("ClickableViewAccessibility")
  override fun onTouchEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.handleTouchEvent(event, dispatcher, reactContext)
      jsPointerDispatcher?.handleMotionEvent(event, dispatcher, false)
    }
    super.onTouchEvent(event)
    return true
  }

  override fun onInterceptHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(event, it, true) }
    return super.onInterceptHoverEvent(event)
  }

  override fun onHoverEvent(event: MotionEvent): Boolean {
    eventDispatcher?.let { jsPointerDispatcher?.handleMotionEvent(event, it, false) }
    return super.onHoverEvent(event)
  }

  @OptIn(UnstableReactNativeAPI::class)
  override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
    eventDispatcher?.let { dispatcher ->
      jsTouchDispatcher.onChildStartedNativeGesture(ev, dispatcher, reactContext)
      jsPointerDispatcher?.onChildStartedNativeGesture(childView, ev, dispatcher)
    }
  }

  override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
    eventDispatcher?.let { jsTouchDispatcher.onChildEndedNativeGesture(ev, it) }
    jsPointerDispatcher?.onChildEndedNativeGesture()
  }

  override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
    // No-op - override to still receive events in onInterceptTouchEvent
    // even when a child view disallows interception
  }

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }
}
