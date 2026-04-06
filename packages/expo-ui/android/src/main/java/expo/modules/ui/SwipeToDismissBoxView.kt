package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxState
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import kotlin.math.abs

data class SwipeToDismissBoxProps(
  val enableDismissFromStartToEnd: Boolean = true,
  val enableDismissFromEndToStart: Boolean = true,
  val gesturesEnabled: Boolean = true,
  val positionalThreshold: Float? = null,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SwipeToDismissBoxContent(
  props: SwipeToDismissBoxProps,
  onStartToEnd: () -> Unit,
  onEndToStart: () -> Unit
) {
  val currentThreshold = rememberUpdatedState(props.positionalThreshold ?: 0.5f)
  val currentOnStartToEnd = rememberUpdatedState(onStartToEnd)
  val currentOnEndToStart = rememberUpdatedState(onEndToStart)

  val density = LocalDensity.current

  // We use the deprecated SwipeToDismissBoxState constructor because:
  // 1. The non-deprecated constructor sets velocityThreshold = 0f, which causes ANY
  //    release velocity to bypass positionalThreshold (settling via closestAnchor at ~50%).
  // 2. Even the deprecated constructor's velocityThreshold (125.dp) is too low — most
  //    finger releases exceed it, so closestAnchor still wins over positionalThreshold.
  // 3. Therefore we use confirmValueChange to enforce the threshold: it checks the actual
  //    drag offset at the moment of release and rejects the dismiss if below threshold.
  val stateRef = remember { arrayOfNulls<SwipeToDismissBoxState>(1) }
  var anchorDistance = remember { floatArrayOf(0f) }

  @Suppress("DEPRECATION")
  val swipeToDismissBoxState = remember {
    SwipeToDismissBoxState(
      initialValue = SwipeToDismissBoxValue.Settled,
      density = density,
      confirmValueChange = { newValue ->
        if (newValue == SwipeToDismissBoxValue.Settled) return@SwipeToDismissBoxState true
        val state = stateRef[0] ?: return@SwipeToDismissBoxState true
        val offset = try { state.requireOffset() } catch (_: IllegalStateException) { 0f }
        abs(offset) >= anchorDistance[0] * currentThreshold.value
      },
      positionalThreshold = { totalDistance ->
        anchorDistance[0] = totalDistance
        totalDistance * currentThreshold.value
      }
    ).also { stateRef[0] = it }
  }

  val backgroundSlot = findChildSlotView(view, "backgroundContent")
  val backgroundStartToEndSlot = findChildSlotView(view, "backgroundStartToEnd")
  val backgroundEndToStartSlot = findChildSlotView(view, "backgroundEndToStart")

  SwipeToDismissBox(
    state = swipeToDismissBoxState,
    backgroundContent = {
      // Read the swipe offset to dynamically size the background
      val offset = try {
        swipeToDismissBoxState.requireOffset()
      } catch (_: IllegalStateException) {
        0f
      }

      // Pick the right slot based on swipe direction, falling back to generic
      val activeSlot = when {
        offset > 0 -> backgroundStartToEndSlot ?: backgroundSlot
        offset < 0 -> backgroundEndToStartSlot ?: backgroundSlot
        else -> backgroundSlot
      }

      if (activeSlot != null) {
        val widthDp = with(LocalDensity.current) { abs(offset).toDp() }
        val alignment = if (offset < 0) Alignment.CenterEnd else Alignment.CenterStart

        Box(
          modifier = Modifier.fillMaxSize(),
          contentAlignment = alignment
        ) {
          Box(
            modifier = Modifier
              .fillMaxHeight()
              .width(widthDp)
          ) {
            activeSlot.renderSlot()
          }
        }
      }
    },
    modifier = ModifierRegistry.applyModifiers(props.modifiers, appContext, composableScope, globalEventDispatcher),
    enableDismissFromStartToEnd = props.enableDismissFromStartToEnd,
    enableDismissFromEndToStart = props.enableDismissFromEndToStart,
    gesturesEnabled = props.gesturesEnabled,
    onDismiss = { direction ->
      when (direction) {
        SwipeToDismissBoxValue.StartToEnd -> currentOnStartToEnd.value()
        SwipeToDismissBoxValue.EndToStart -> currentOnEndToStart.value()
        else -> {}
      }
    }
  ) {
    Children(ComposableScope()) { !isSlotView(it) }
  }
}
