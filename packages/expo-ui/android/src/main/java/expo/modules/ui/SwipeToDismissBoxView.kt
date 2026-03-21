package expo.modules.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.width
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import kotlin.math.abs
import kotlinx.coroutines.flow.filter

data class SwipeToDismissBoxProps(
  val enableDismissFromStartToEnd: Boolean = true,
  val enableDismissFromEndToStart: Boolean = true,
  val gesturesEnabled: Boolean = true,
  val modifiers: ModifierList = emptyList()
) : ComposeProps

@Composable
fun FunctionalComposableScope.SwipeToDismissBoxContent(
  props: SwipeToDismissBoxProps,
  onStartToEnd: () -> Unit,
  onEndToStart: () -> Unit
) {
  val swipeToDismissBoxState = rememberSwipeToDismissBoxState()

  // Fire events after the dismiss animation completes, not during the gesture
  LaunchedEffect(Unit) {
    snapshotFlow { swipeToDismissBoxState.currentValue }
      .filter { it != SwipeToDismissBoxValue.Settled }
      .collect { value ->
        when (value) {
          SwipeToDismissBoxValue.StartToEnd -> onStartToEnd()
          SwipeToDismissBoxValue.EndToStart -> onEndToStart()
          SwipeToDismissBoxValue.Settled -> {}
        }
      }
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
    gesturesEnabled = props.gesturesEnabled
  ) {
    Children(ComposableScope()) { !isSlotView(it) }
  }
}
