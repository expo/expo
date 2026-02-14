package expo.modules.ui

import android.content.Context
import android.content.ContextWrapper
import android.os.SystemClock
import android.view.MotionEvent
import android.view.ViewGroup
import android.view.ViewGroup.LayoutParams.MATCH_PARENT
import android.widget.FrameLayout
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.TouchTargetHelper
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.TouchEvent
import com.facebook.react.uimanager.events.TouchEventCoalescingKeyHelper
import com.facebook.react.uimanager.events.TouchEventType
import com.facebook.react.views.view.ReactViewGroup
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import kotlinx.coroutines.flow.drop
import java.io.Serializable

open class IsOpenedChangeEvent(
  @Field open val isOpened: Boolean = false
) : Record, Serializable

open class SelectedDetentChangeEvent(
  @Field open val selectedDetentIndex: Int = 0
) : Record, Serializable

data class DetentConfig(
  val skipPartiallyExpanded: Boolean,
  val sheetModifier: Modifier,
  val contentModifier: Modifier
)

fun parseDetent(detent: Any?, screenHeightDp: Float): DetentConfig {
  val defaultSheetModifier = Modifier.fillMaxHeight()
  return when (detent) {
    "medium" -> DetentConfig(skipPartiallyExpanded = false, sheetModifier = defaultSheetModifier, contentModifier = Modifier)
    "large" -> DetentConfig(skipPartiallyExpanded = true, sheetModifier = defaultSheetModifier, contentModifier = Modifier.fillMaxHeight())
    is Map<*, *> -> {
      val fraction = (detent["fraction"] as? Number)?.toFloat()
      val height = (detent["height"] as? Number)?.toFloat()
      when {
        fraction != null -> DetentConfig(
          skipPartiallyExpanded = false,
          sheetModifier = defaultSheetModifier,
          contentModifier = Modifier.height((screenHeightDp * fraction).dp)
        )
        height != null -> DetentConfig(
          skipPartiallyExpanded = false,
          sheetModifier = defaultSheetModifier,
          contentModifier = Modifier.height(height.dp)
        )
        else -> DetentConfig(skipPartiallyExpanded = false, sheetModifier = defaultSheetModifier, contentModifier = Modifier)
      }
    }
    else -> DetentConfig(skipPartiallyExpanded = false, sheetModifier = defaultSheetModifier, contentModifier = Modifier)
  }
}

private fun findReactContext(context: Context): ReactContext? {
  var ctx: Context = context
  while (ctx is ContextWrapper && ctx !is ReactContext) {
    ctx = ctx.baseContext
  }
  return ctx as? ReactContext
}

/**
 * Touch-forwarding ViewGroup injected between the dialog's DecorView and its content.
 * Intercepts all touches and forwards them to RN's JS touch system, then lets them
 * continue to Compose for sheet drag / scrim dismiss.
 *
 * Bypasses [JSTouchDispatcher] and manually creates [TouchEvent]s with Yoga-corrected
 * pageX/pageY. Fabric's `dom::measure()` returns positions accumulated from the Yoga
 * shadow tree, but dialog views are at different screen positions. We bridge this by
 * computing the hostView's accumulated Yoga position (walking getLeft/getTop in the
 * main window) and adding the touch offset relative to the RN root in the dialog.
 */
class BottomSheetTouchDispatcher(
  private val reactContext: ReactContext,
  private val hostView: android.view.View?
) : FrameLayout(reactContext) {
  private var rnRootView: ViewGroup? = null
  private var hostYogaAccumPx: IntArray? = null
  private val coalescingKeyHelper = TouchEventCoalescingKeyHelper()
  private var currentTargetTag = -1
  private var gestureStartTime = TouchEvent.UNSET
  private val targetCoordinates = FloatArray(2)

  /**
   * Walk the view tree to find the first [ReactViewGroup] for touch target resolution.
   */
  fun findAndAttachRNRoot() {
    val rnView = findReactViewGroup(this)
    if (rnView != null) {
      rnRootView = rnView
    }

    // Compute hostView's accumulated Yoga position from the surface root (in pixels).
    // Walk up the main-window view tree summing getLeft()/getTop() (Fabric/Yoga-set
    // pixel values) until we reach the surface view. This gives us the same coordinate
    // origin as Fabric's dom::measure(), so Pressability's bounds check will pass.
    if (hostView != null) {
      val activity = reactContext.currentActivity
      val contentView = activity?.findViewById<ViewGroup>(android.R.id.content)
      val surfaceView = if (contentView != null && contentView.childCount > 0) contentView.getChildAt(0) else null

      var x = 0
      var y = 0
      var current: android.view.View? = hostView
      while (current != null && current !== surfaceView) {
        x += current.left
        y += current.top
        val parent = current.parent as? android.view.View ?: break
        current = parent
      }
      hostYogaAccumPx = intArrayOf(x, y)
    }
  }

  private fun findReactViewGroup(view: android.view.View): ReactViewGroup? {
    if (view is ReactViewGroup) return view
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val result = findReactViewGroup(view.getChildAt(i))
        if (result != null) return result
      }
    }
    return null
  }

  private fun dispatchToJS(event: MotionEvent) {
    val rnRoot = rnRootView ?: return
    val hostAccum = hostYogaAccumPx ?: return

    val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
    val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext, surfaceId) ?: return

    // Coordinates relative to rnRoot (for TouchTargetHelper hit-testing)
    val myLoc = IntArray(2)
    getLocationOnScreen(myLoc)
    val rnLoc = IntArray(2)
    rnRoot.getLocationOnScreen(rnLoc)
    val localX = event.x + (myLoc[0] - rnLoc[0])
    val localY = event.y + (myLoc[1] - rnLoc[1])

    // Yoga-corrected pageX/pageY (in pixels, converted to DP by TouchesHelper).
    // (rawX - rnLoc[0]) = touch position relative to the RN root view in the dialog.
    // hostAccum = hostView's accumulated Yoga position from the surface root (px).
    // Sum = touch position in Yoga's coordinate space, matching dom::measure().
    val pageX = (event.rawX - rnLoc[0]) + hostAccum[0].toFloat()
    val pageY = (event.rawY - rnLoc[1]) + hostAccum[1].toFloat()

    val action = event.actionMasked

    if (action == MotionEvent.ACTION_DOWN) {
      currentTargetTag = TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        localX, localY, rnRoot, targetCoordinates, null)
      if (currentTargetTag == -1) return
      gestureStartTime = event.eventTime

      // Create MotionEvent copy with root-relative coordinates for correct pageX/pageY
      val copy = MotionEvent.obtain(event)
      copy.setLocation(pageX, pageY)
      eventDispatcher.dispatchEvent(
        TouchEvent.obtain(surfaceId, currentTargetTag, TouchEventType.START,
          copy, gestureStartTime, targetCoordinates[0], targetCoordinates[1], coalescingKeyHelper))
      copy.recycle()
    } else if (action == MotionEvent.ACTION_UP && currentTargetTag != -1) {
      TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        localX, localY, rnRoot, targetCoordinates, null)

      val copy = MotionEvent.obtain(event)
      copy.setLocation(pageX, pageY)
      eventDispatcher.dispatchEvent(
        TouchEvent.obtain(surfaceId, currentTargetTag, TouchEventType.END,
          copy, gestureStartTime, targetCoordinates[0], targetCoordinates[1], coalescingKeyHelper))
      copy.recycle()
      currentTargetTag = -1
      gestureStartTime = TouchEvent.UNSET
    } else if (action == MotionEvent.ACTION_MOVE && currentTargetTag != -1) {
      TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        localX, localY, rnRoot, targetCoordinates, null)

      val copy = MotionEvent.obtain(event)
      copy.setLocation(pageX, pageY)
      eventDispatcher.dispatchEvent(
        TouchEvent.obtain(surfaceId, currentTargetTag, TouchEventType.MOVE,
          copy, gestureStartTime, targetCoordinates[0], targetCoordinates[1], coalescingKeyHelper))
      copy.recycle()
    } else if (action == MotionEvent.ACTION_CANCEL && currentTargetTag != -1) {
      val copy = MotionEvent.obtain(event)
      copy.setLocation(pageX, pageY)
      eventDispatcher.dispatchEvent(
        TouchEvent.obtain(surfaceId, currentTargetTag, TouchEventType.CANCEL,
          copy, gestureStartTime, targetCoordinates[0], targetCoordinates[1], coalescingKeyHelper))
      copy.recycle()
      currentTargetTag = -1
      gestureStartTime = TouchEvent.UNSET
    }
  }

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (event.actionMasked == MotionEvent.ACTION_DOWN && rnRootView == null) {
      findAndAttachRNRoot()
    }
    dispatchToJS(event)
    return super.dispatchTouchEvent(event)
  }

  /**
   * When the dialog is torn down (sheet dismissed), cancel any in-flight gesture
   * so RN's JS touch system doesn't think a touch is still active.
   * Without this, subsequent touches on the main screen are blocked.
   */
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    if (currentTargetTag != -1) {
      val surfaceId = UIManagerHelper.getSurfaceId(reactContext)
      val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext, surfaceId)
      if (eventDispatcher != null) {
        val now = SystemClock.uptimeMillis()
        val cancel = MotionEvent.obtain(now, now, MotionEvent.ACTION_CANCEL, 0f, 0f, 0)
        eventDispatcher.dispatchEvent(
          TouchEvent.obtain(surfaceId, currentTargetTag, TouchEventType.CANCEL,
            cancel, gestureStartTime, targetCoordinates[0], targetCoordinates[1], coalescingKeyHelper))
        cancel.recycle()
      }
      currentTargetTag = -1
      gestureStartTime = TouchEvent.UNSET
    }
  }

}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BottomSheetComposable(
  skipPartiallyExpanded: Boolean,
  isOpened: Boolean,
  onIsOpenedChange: (Boolean) -> Unit,
  fitToContents: Boolean = false,
  detents: List<Any>? = null,
  selectedDetent: Any? = null,
  onSelectedDetentChange: ((Int) -> Unit)? = null,
  containerColor: android.graphics.Color? = null,
  hostView: android.view.View? = null,
  content: @Composable () -> Unit
) {
  val screenHeightDp = LocalConfiguration.current.screenHeightDp.toFloat()
  val detentConfig = if (fitToContents) {
    // No fillMaxHeight on sheet so it sizes to content; skip partial so it expands to content height
    DetentConfig(skipPartiallyExpanded = true, sheetModifier = Modifier, contentModifier = Modifier)
  } else {
    val activeDetent = selectedDetent ?: detents?.firstOrNull()
    if (activeDetent != null) {
      parseDetent(activeDetent, screenHeightDp)
    } else {
      DetentConfig(skipPartiallyExpanded = skipPartiallyExpanded, sheetModifier = Modifier.fillMaxHeight(), contentModifier = Modifier)
    }
  }

  val sheetState = rememberModalBottomSheetState(detentConfig.skipPartiallyExpanded)

  // Capture the ReactContext from the outer composition (before the dialog).
  // Inside ModalBottomSheet, LocalContext is the dialog's ContextThemeWrapper
  // which does NOT contain ReactContext in its chain, so findReactContext would return null.
  val outerContext = LocalContext.current
  val reactContext: ReactContext? = remember(outerContext) { findReactContext(outerContext) }

  // Internal state controlling sheet composition. Stays true until hide animation completes,
  // so programmatic dismiss (isOpened → false) animates the sheet down before removal.
  var showSheet by remember { mutableStateOf(false) }

  LaunchedEffect(isOpened) {
    if (isOpened) {
      showSheet = true
    } else if (showSheet) {
      sheetState.hide()
      showSheet = false
    }
  }

  if (showSheet) {
    if (onSelectedDetentChange != null && detents != null && detents.size > 1) {
      LaunchedEffect(sheetState) {
        snapshotFlow { sheetState.currentValue }
          .drop(1)
          .collect { value ->
            val newDetentIndex = when (value) {
              SheetValue.PartiallyExpanded -> 0
              SheetValue.Expanded -> detents.size - 1
              else -> return@collect
            }
            onSelectedDetentChange(newDetentIndex)
          }
      }
    }

    ModalBottomSheet(
      sheetState = sheetState,
      modifier = detentConfig.sheetModifier,
      onDismissRequest = { onIsOpenedChange(false) },
      containerColor = containerColor.composeOrNull ?: androidx.compose.ui.graphics.Color.White
    ) {
      // Inject a touch-forwarding dispatcher into the dialog's view hierarchy.
      // ModalBottomSheet creates a separate dialog window, so RN's ReactRootView never sees
      // touches. We insert BottomSheetTouchDispatcher between the DecorView and its content
      // via View.post (deferred to next message loop iteration, after composition is committed
      // and all views are stable). The dispatcher intercepts touches, forwards them to JS via
      // JSTouchDispatcher, then lets them continue to Compose for sheet drag / scrim dismiss.
      if (reactContext != null) {
        val composeView = LocalView.current
        DisposableEffect(composeView) {
          composeView.post {
            val rootView = composeView.rootView as? ViewGroup ?: return@post
            if (rootView.childCount == 0) return@post
            if (rootView.getChildAt(0) is BottomSheetTouchDispatcher) return@post

            val contentView = rootView.getChildAt(0)
            val contentParams = contentView.layoutParams
            rootView.removeViewAt(0)

            val touchDispatcher = BottomSheetTouchDispatcher(reactContext, hostView)
            touchDispatcher.addView(contentView, FrameLayout.LayoutParams(MATCH_PARENT, MATCH_PARENT))
            rootView.addView(touchDispatcher, 0, contentParams)
            touchDispatcher.findAndAttachRNRoot()
          }
          onDispose { }
        }
      }

      Box(modifier = detentConfig.contentModifier) { content() }
    }
  }
}

data class BottomSheetProps(
  val isOpened: Boolean = false,
  val skipPartiallyExpanded: Boolean = false,
  val fitToContents: Boolean = false,
  val detents: List<Any>? = null,
  val selectedDetent: Any? = null,
  val containerColor: android.graphics.Color? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.BottomSheetContent(
  props: BottomSheetProps,
  onIsOpenedChange: (IsOpenedChangeEvent) -> Unit,
  onSelectedDetentChange: ((SelectedDetentChangeEvent) -> Unit)? = null
) {
  Box {
    BottomSheetComposable(
      props.skipPartiallyExpanded,
      props.isOpened,
      onIsOpenedChange = { value -> onIsOpenedChange(IsOpenedChangeEvent(value)) },
      fitToContents = props.fitToContents,
      detents = props.detents,
      selectedDetent = props.selectedDetent,
      onSelectedDetentChange = if (onSelectedDetentChange != null) {
        { index -> onSelectedDetentChange(SelectedDetentChangeEvent(index)) }
      } else {
        null
      },
      containerColor = props.containerColor,
      hostView = this@BottomSheetContent.view
    ) {
      Children(ComposableScope())
    }
  }
}
