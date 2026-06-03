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
import androidx.core.view.NestedScrollingChild3
import androidx.core.view.NestedScrollingChildHelper
import androidx.core.view.ViewCompat
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
        flushPendingStateUpdates()
      }
    }
  }
}

/**
 * A thin FrameLayout that intercepts touch events and dispatches them to JS via
 * JSTouchDispatcher/JSPointerDispatcher, replicating the pattern from React Native's
 * DialogRootViewGroup in ReactModalHostView.
 * Implements NestedScrollingChild3 to forward scroll events to the parent compose
 */
private class TouchDispatchingRootViewGroup(
  context: Context
) : FrameLayout(context), RootView, NestedScrollingChild3 {
  private val jsTouchDispatcher = JSTouchDispatcher(this)
  private var jsPointerDispatcher: JSPointerDispatcher? = null

  private val childHelper = NestedScrollingChildHelper(this)

  // How far this view has moved on-screen since the current gesture started.
  private val gestureStartLocation = IntArray(2)
  private val currentLocation = IntArray(2)
  private var trackingGestureOffset = false

  // True if the sheet consumed scroll on the most recent drag frame
  // Used to decide the fling handoff in onNestedPreFling.
  private var sheetMovingOnLastDragFrame = false

  // True once a real fling was dispatched this gesture (its settle is already in motion), so the
  // gentle-release fallback in onStopNestedScroll doesn't fire a second, redundant settle.
  private var flingHandledThisGesture = false

  var eventDispatcher: EventDispatcher? = null

  private val reactContext: ThemedReactContext
    get() = context as ThemedReactContext

  init {
    if (ReactFeatureFlags.dispatchPointerEvents) {
      jsPointerDispatcher = JSPointerDispatcher(this)
    }
    childHelper.isNestedScrollingEnabled = true
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

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    when (ev.actionMasked) {
      MotionEvent.ACTION_DOWN -> {
        getLocationInWindow(gestureStartLocation)
        trackingGestureOffset = true
        sheetMovingOnLastDragFrame = false
        flingHandledThisGesture = false
      }
      MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> trackingGestureOffset = false
    }
    if (trackingGestureOffset && hasNestedScrollingParent()) {
      getLocationInWindow(currentLocation)
      val dy = currentLocation[1] - gestureStartLocation[1]
      if (dy != 0) {
        ev.offsetLocation(0f, dy.toFloat())
        val handled = super.dispatchTouchEvent(ev)
        ev.offsetLocation(0f, -dy.toFloat())
        return handled
      }
    }
    return super.dispatchTouchEvent(ev)
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

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }

  // Parent role: receive scroll from the RN list
  override fun onStartNestedScroll(child: View, target: View, axes: Int): Boolean =
    axes and ViewCompat.SCROLL_AXIS_VERTICAL != 0 || axes and ViewCompat.SCROLL_AXIS_HORIZONTAL != 0

  override fun onNestedScrollAccepted(child: View, target: View, axes: Int) {
    super.onNestedScrollAccepted(child, target, axes)
    startNestedScroll(axes)
  }

  override fun onStopNestedScroll(target: View) {
    // Must run BEFORE stopNestedScroll() so the holder is still our parent to receive the fling.
    settleSheetIfNoFling()
    super.onStopNestedScroll(target)
    stopNestedScroll()
  }

  // A slow (sub-threshold) release never flings, so the ScrollView never triggers the sheet's
  // onPostFling settle and it hangs where dragged. If the sheet moved during the gesture and no real
  // fling settled it, dispatch a zero-velocity fling here so the holder snaps it to the nearest anchor.
  private fun settleSheetIfNoFling() {
    if (sheetMovingOnLastDragFrame && !flingHandledThisGesture) {
      flingHandledThisGesture = true
      dispatchNestedFling(0f, 0f, false)
    }
  }

  override fun onNestedPreScroll(target: View, dx: Int, dy: Int, consumed: IntArray) {
    dispatchNestedPreScroll(dx, dy, consumed, null)
    // Expand path: the sheet consumes the upward delta here, before the list scrolls.
    sheetMovingOnLastDragFrame = consumed[1] != 0
  }

  override fun onNestedScroll(target: View, dxConsumed: Int, dyConsumed: Int, dxUnconsumed: Int, dyUnconsumed: Int) {
    // Use the `…, type, consumed` variant so we can read how much the sheet ate (consumed[1]).
    val consumed = IntArray(2)
    dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, null, ViewCompat.TYPE_TOUCH, consumed)
    // Collapse path: the sheet consumes the leftover here, after the list couldn't scroll.
    if (consumed[1] != 0) sheetMovingOnLastDragFrame = true
  }

  override fun onNestedPreFling(target: View, velocityX: Float, velocityY: Float): Boolean {
    // A real fling is being dispatched; its settle is in motion, so skip the sub-threshold fallback.
    flingHandledThisGesture = true
    val composeConsumed = dispatchNestedPreFling(velocityX, velocityY)
    // RN's ScrollView wants a synchronous yes/no, but Compose's pre-fling is async (returns false
    // now, settles later). So decide here: if the sheet was mid-move and this is an UP-flick
    // (velocityY > 0), swallow the list fling so the sheet expands first. A DOWN-flick is left to
    // pass through so it can still settle/collapse.
    return composeConsumed || (sheetMovingOnLastDragFrame && velocityY > 0)
  }

  override fun onNestedFling(target: View, velocityX: Float, velocityY: Float, consumed: Boolean): Boolean =
    dispatchNestedFling(velocityX, velocityY, consumed)

  // Child role: relay up to the holder
  override fun setNestedScrollingEnabled(enabled: Boolean) {
    childHelper.isNestedScrollingEnabled = enabled
  }
  override fun isNestedScrollingEnabled(): Boolean = childHelper.isNestedScrollingEnabled
  override fun startNestedScroll(axes: Int): Boolean = childHelper.startNestedScroll(axes)
  override fun startNestedScroll(axes: Int, type: Int): Boolean = childHelper.startNestedScroll(axes, type)
  override fun stopNestedScroll() = childHelper.stopNestedScroll()
  override fun stopNestedScroll(type: Int) = childHelper.stopNestedScroll(type)
  override fun hasNestedScrollingParent(): Boolean = childHelper.hasNestedScrollingParent()
  override fun hasNestedScrollingParent(type: Int): Boolean = childHelper.hasNestedScrollingParent(type)

  override fun dispatchNestedScroll(
    dxConsumed: Int,
    dyConsumed: Int,
    dxUnconsumed: Int,
    dyUnconsumed: Int,
    offsetInWindow: IntArray?
  ): Boolean = childHelper.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow)

  override fun dispatchNestedScroll(
    dxConsumed: Int,
    dyConsumed: Int,
    dxUnconsumed: Int,
    dyUnconsumed: Int,
    offsetInWindow: IntArray?,
    type: Int
  ): Boolean = childHelper.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow, type)

  override fun dispatchNestedScroll(
    dxConsumed: Int,
    dyConsumed: Int,
    dxUnconsumed: Int,
    dyUnconsumed: Int,
    offsetInWindow: IntArray?,
    type: Int,
    consumed: IntArray
  ) {
    childHelper.dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, offsetInWindow, type, consumed)
  }

  override fun dispatchNestedPreScroll(
    dx: Int,
    dy: Int,
    consumed: IntArray?,
    offsetInWindow: IntArray?
  ): Boolean = childHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow)

  override fun dispatchNestedPreScroll(
    dx: Int,
    dy: Int,
    consumed: IntArray?,
    offsetInWindow: IntArray?,
    type: Int
  ): Boolean = childHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow, type)

  override fun dispatchNestedFling(velocityX: Float, velocityY: Float, consumed: Boolean): Boolean =
    childHelper.dispatchNestedFling(velocityX, velocityY, consumed)

  override fun dispatchNestedPreFling(velocityX: Float, velocityY: Float): Boolean =
    childHelper.dispatchNestedPreFling(velocityX, velocityY)
}
