package expo.modules.devlauncher.compose.ui

import androidx.compose.animation.core.animate
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import kotlin.math.roundToInt

private val INDICATOR_SIZE = 28.dp
private val REFRESH_THRESHOLD = 80.dp
private val MAX_DRAG_DISTANCE = 120.dp
private const val DRAG_MULTIPLIER = 0.5f

@Composable
fun PullToRefreshContainer(
  isRefreshing: Boolean,
  onRefresh: () -> Unit,
  modifier: Modifier = Modifier,
  content: @Composable () -> Unit
) {
  val density = LocalDensity.current
  val refreshThresholdPx = with(density) { REFRESH_THRESHOLD.toPx() }
  val maxDragPx = with(density) { MAX_DRAG_DISTANCE.toPx() }

  var dragOffset by remember { mutableFloatStateOf(0f) }
  var isAnimating by remember { mutableStateOf(false) }

  val currentOnRefresh by rememberUpdatedState(onRefresh)
  val currentIsRefreshing by rememberUpdatedState(isRefreshing)

  LaunchedEffect(isRefreshing) {
    if (isRefreshing) {
      isAnimating = true
      animate(
        initialValue = dragOffset,
        targetValue = refreshThresholdPx,
        animationSpec = tween(200)
      ) { value, _ ->
        dragOffset = value
      }
      isAnimating = false
    }
  }

  LaunchedEffect(isRefreshing) {
    if (!isRefreshing && dragOffset > 0) {
      isAnimating = true
      animate(
        initialValue = dragOffset,
        targetValue = 0f,
        animationSpec = tween(300)
      ) { value, _ ->
        dragOffset = value
      }
      isAnimating = false
    }
  }

  val nestedScrollConnection = remember {
    object : NestedScrollConnection {
      override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
        // While refreshing or animating, don't allow pull gestures to interfere
        if (currentIsRefreshing || isAnimating) {
          return Offset.Zero
        }

        // If indicator is extended and user scrolls up, retract indicator first
        if (dragOffset > 0 && available.y < 0) {
          val newOffset = (dragOffset + available.y).coerceAtLeast(0f)
          val consumed = dragOffset - newOffset
          dragOffset = newOffset
          return Offset(0f, -consumed)
        }
        return Offset.Zero
      }

      override fun onPostScroll(
        consumed: Offset,
        available: Offset,
        source: NestedScrollSource
      ): Offset {
        if (currentIsRefreshing || isAnimating) {
          return Offset.Zero
        }

        // Downward overscroll at the top of the child - extend the indicator
        if (available.y > 0 && source == NestedScrollSource.UserInput) {
          dragOffset = (dragOffset + available.y * DRAG_MULTIPLIER).coerceIn(0f, maxDragPx)
          return Offset(0f, available.y)
        }
        return Offset.Zero
      }

      override suspend fun onPreFling(available: Velocity): Velocity {
        if (currentIsRefreshing || isAnimating || dragOffset <= 0f) {
          return Velocity.Zero
        }

        if (dragOffset >= refreshThresholdPx) {
          currentOnRefresh()
        } else {
          isAnimating = true
          animate(
            initialValue = dragOffset,
            targetValue = 0f,
            animationSpec = tween(200)
          ) { value, _ ->
            dragOffset = value
          }
          isAnimating = false
        }

        return Velocity(0f, available.y)
      }
    }
  }

  val indicatorHeightDp = with(density) { dragOffset.toDp() }
  val progress = dragOffset / refreshThresholdPx

  Box(modifier = modifier.nestedScroll(nestedScrollConnection)) {
    // Content is offset downward by the drag amount
    Box(
      modifier = Modifier.offset { IntOffset(0, dragOffset.roundToInt()) }
    ) {
      content()
    }

    // Indicator drawn on top, in the revealed area
    if (dragOffset > 1f) {
      Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
          .fillMaxWidth()
          .height(indicatorHeightDp)
      ) {
        CircularProgressBar(
          size = INDICATOR_SIZE,
          progress = if (isRefreshing) null else progress
        )
      }
    }
  }
}
