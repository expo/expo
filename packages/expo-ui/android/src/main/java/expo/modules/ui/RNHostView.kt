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
import androidx.core.view.NestedScrollingParent3
import androidx.core.view.NestedScrollingParentHelper
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
 * A FrameLayout that lets a descendant React Native scrollable (an [android.widget.ScrollView], as
 * used by FlatList / FlashList / ScrollView) cooperate with a Jetpack Compose parent that hosts it
 * through `AndroidView` (e.g. a Material3 `ModalBottomSheet`): the list scrolls until it hits a
 * bound, then the leftover motion drives the Compose parent.
 *
 * This is non-trivial because the two worlds disagree in three ways, each handled here:
 *
 *  1. Two nested-scroll protocols. `android.widget.ScrollView` dispatches on the *framework* API
 *     (the no-`type` parent methods); Compose's `AndroidView` only listens on the *androidx* API
 *     (the `type` variants). We implement both parent protocols and relay everything upward through
 *     [NestedScrollingChild3] to Compose's holder. (The holder only forwards when the hosted view
 *     reports nested scrolling enabled, hence the `init` below.)
 *
 *  2. A coordinate-echo feedback loop. As the Compose parent translates this view while scrolling,
 *     the `MotionEvent`s shift with it; a coordinate-based `ScrollView` misreads the shift as finger
 *     movement and feeds it back to the parent (a per-frame stutter). Compose translates
 *     asynchronously, so the framework's own offset compensation never triggers. [dispatchTouchEvent]
 *     cancels the shift.
 *
 *  3. Fling timing. The View fling wants a synchronous "did you take it?" answer that Compose only
 *     resolves asynchronously, and a sub-threshold release never flings at all. [onNestedPreFling]
 *     and [settleSheetIfNoFling] approximate the handoff so the parent expands/snaps like a
 *     Compose `LazyColumn`.
 */
@SuppressLint("ViewConstructor")
private open class NestedScrollInteropFrameLayout(
  context: Context
) : FrameLayout(context), NestedScrollingParent3, NestedScrollingChild3 {
  private val parentHelper = NestedScrollingParentHelper(this)
  private val childHelper = NestedScrollingChildHelper(this)

  // How far this view has moved on-screen since the current gesture started, used to cancel the
  // coordinate echo (see dispatchTouchEvent).
  private val gestureStartLocation = IntArray(2)
  private val currentLocation = IntArray(2)
  private var trackingGestureOffset = false

  // True when the Compose parent consumed scroll on the most recent drag frame, i.e. it is mid-move
  // and not settled at an anchor. Drives the fling/settle handoff below.
  private var sheetMovingOnLastDragFrame = false

  // True once a fling has been dispatched for this gesture (its onPostFling settles the parent), so
  // the sub-threshold fallback in settleSheetIfNoFling doesn't also fire.
  private var flingHandledThisGesture = false

  init {
    // Compose's AndroidViewHolder gates forwarding on the hosted view's isNestedScrollingEnabled.
    childHelper.isNestedScrollingEnabled = true
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
    // Cancel the coordinate echo: when the Compose parent translates this view via nested scroll,
    // the dispatched MotionEvents shift with it. A child android.widget.ScrollView derives its
    // scroll from absolute coordinates and would misread that shift as finger movement, feeding it
    // back to the parent (a one-frame stutter). Compose translates asynchronously, so the
    // framework's own mScrollOffset compensation can't catch it. Offset events back by how far we
    // have actually moved on-screen since the gesture began, then restore so we don't mutate the
    // event Compose still owns.
    //
    // Gated on an active nested-scroll session (hasNestedScrollingParent): only a descendant
    // scrollable driving the parent should ever move us mid-gesture. Without this gate the
    // compensation would also fire for unrelated movement — dragging the sheet by a non-scrollable
    // RN area, or the host animating its position (collapsing header, transition, keyboard) while
    // touched — and wrongly shift those touches. With it, non-scroll content is completely unaffected.
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

  // region NestedScrollingParent — receives deltas from the descendant RN scrollable

  // androidx (`type`) variants — used by androidx children e.g. RecyclerView.
  override fun onStartNestedScroll(child: View, target: View, axes: Int, type: Int): Boolean =
    axes and ViewCompat.SCROLL_AXIS_VERTICAL != 0 || axes and ViewCompat.SCROLL_AXIS_HORIZONTAL != 0

  override fun onNestedScrollAccepted(child: View, target: View, axes: Int, type: Int) {
    parentHelper.onNestedScrollAccepted(child, target, axes, type)
    // Relay upward so our parent (Compose's holder) becomes our nested-scroll parent.
    startNestedScroll(axes, type)
  }

  override fun onStopNestedScroll(target: View, type: Int) {
    if (type == ViewCompat.TYPE_TOUCH) settleSheetIfNoFling()
    parentHelper.onStopNestedScroll(target, type)
    stopNestedScroll(type)
  }

  override fun onNestedPreScroll(target: View, dx: Int, dy: Int, consumed: IntArray, type: Int) {
    // Let the Compose parent consume first (used when dragging to expand the sheet).
    dispatchNestedPreScroll(dx, dy, consumed, null, type)
    if (type == ViewCompat.TYPE_TOUCH) sheetMovingOnLastDragFrame = consumed[1] != 0
  }

  override fun onNestedScroll(
    target: View,
    dxConsumed: Int,
    dyConsumed: Int,
    dxUnconsumed: Int,
    dyUnconsumed: Int,
    type: Int,
    consumed: IntArray
  ) {
    // Relay the list's leftover (unconsumed) deltas up to Compose (drags the parent at bounds).
    dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, null, type, consumed)
    if (type == ViewCompat.TYPE_TOUCH && consumed[1] != 0) sheetMovingOnLastDragFrame = true
  }

  override fun onNestedScroll(
    target: View,
    dxConsumed: Int,
    dyConsumed: Int,
    dxUnconsumed: Int,
    dyUnconsumed: Int,
    type: Int
  ) {
    dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, null, type)
  }

  override fun getNestedScrollAxes(): Int = parentHelper.nestedScrollAxes

  // Framework (no-`type`) variants — the protocol android.widget.ScrollView (React Native's
  // ScrollView / FlatList) actually dispatches with. Without these the session never starts for it.
  override fun onStartNestedScroll(child: View, target: View, axes: Int): Boolean =
    axes and ViewCompat.SCROLL_AXIS_VERTICAL != 0 || axes and ViewCompat.SCROLL_AXIS_HORIZONTAL != 0

  override fun onNestedScrollAccepted(child: View, target: View, axes: Int) {
    parentHelper.onNestedScrollAccepted(child, target, axes)
    startNestedScroll(axes)
  }

  override fun onStopNestedScroll(target: View) {
    settleSheetIfNoFling()
    parentHelper.onStopNestedScroll(target)
    stopNestedScroll()
  }

  override fun onNestedPreScroll(target: View, dx: Int, dy: Int, consumed: IntArray) {
    dispatchNestedPreScroll(dx, dy, consumed, null)
    sheetMovingOnLastDragFrame = consumed[1] != 0
  }

  override fun onNestedScroll(
    target: View,
    dxConsumed: Int,
    dyConsumed: Int,
    dxUnconsumed: Int,
    dyUnconsumed: Int
  ) {
    val consumed = IntArray(2)
    dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed, null, ViewCompat.TYPE_TOUCH, consumed)
    if (consumed[1] != 0) sheetMovingOnLastDragFrame = true
  }

  override fun onNestedPreFling(target: View, velocityX: Float, velocityY: Float): Boolean {
    // A real fling is being dispatched; its onPreFling/onPostFling settles the parent, so the
    // sub-threshold fallback in settleSheetIfNoFling must not also fire.
    flingHandledThisGesture = true
    // Relay so the parent's (async) pre-fling can run.
    val composeConsumed = dispatchNestedPreFling(velocityX, velocityY)
    // Compose's nested-scroll fling is async, so decide the handoff synchronously here:
    //  - Upward (expand) fling while the parent is mid-move (velocityY > 0): swallow the list fling
    //    so the parent expands first, matching a Compose LazyColumn.
    //  - Downward (collapse) fling: do NOT swallow. Returning false lets the ScrollView dispatch
    //    onNestedFling -> the holder's dispatchPostFling -> the parent snaps to a lower anchor.
    //    Swallowing would skip onNestedFling and the parent would stop mid-drag without snapping.
    //    (The list won't spuriously fling: ScrollView's canFling is false at the top with downward
    //    velocity.)
    return composeConsumed || (sheetMovingOnLastDragFrame && velocityY > 0)
  }

  override fun onNestedFling(target: View, velocityX: Float, velocityY: Float, consumed: Boolean): Boolean =
    dispatchNestedFling(velocityX, velocityY, consumed)

  // A gentle (sub-threshold) release never flings, so android.widget.ScrollView never triggers the
  // parent's onPostFling settle and it hangs where dragged. If the parent moved during the gesture
  // and nothing settled it, dispatch a zero-velocity nested fling here (while our parent is still
  // attached) so the holder snaps it to the nearest anchor — matching a Compose LazyColumn.
  private fun settleSheetIfNoFling() {
    if (sheetMovingOnLastDragFrame && !flingHandledThisGesture) {
      flingHandledThisGesture = true
      dispatchNestedFling(0f, 0f, false)
    }
  }

  // endregion NestedScrollingParent

  // region NestedScrollingChild — relays to our own parent (Compose's AndroidViewHolder)

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

  // endregion NestedScrollingChild
}

/**
 * Adds React Native's [RootView] touch dispatch (JSTouchDispatcher / JSPointerDispatcher) on top of
 * [NestedScrollInteropFrameLayout], so the hosted RN view tree receives touch/pointer events even
 * though it lives in a detached window. Replicates the DialogRootViewGroup pattern from RN's
 * ReactModalHostView.
 */
@SuppressLint("ViewConstructor")
private class TouchDispatchingRootViewGroup(
  context: Context
) : NestedScrollInteropFrameLayout(context), RootView {
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

  override fun handleException(t: Throwable) {
    reactContext.reactApplicationContext.handleException(RuntimeException(t))
  }
}
