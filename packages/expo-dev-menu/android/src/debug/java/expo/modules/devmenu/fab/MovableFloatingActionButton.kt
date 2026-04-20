package expo.modules.devmenu.fab

import android.annotation.SuppressLint
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.drag
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.DevMenuState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch

private val FabDefaultSize = DpSize(72.dp, 94.dp)
private val Margin = 16.dp
private const val ClickDragTolerance = 40f

/**
 * A floating action button that can be dragged across the screen and springs to the
 * nearest horizontal edge when released. A tap triggers the onClick action.
 */
@SuppressLint("UnusedBoxWithConstraintsScope")
@Composable
fun MovableFloatingActionButton(
  state: DevMenuState,
  modifier: Modifier = Modifier,
  fabSize: DpSize = FabDefaultSize,
  margin: Dp = Margin,
  onPress: () -> Unit = {}
) {
  BoxWithConstraints(modifier = modifier.fillMaxSize()) {
    val totalFabSize = DpSize(fabSize.width + margin * 2, fabSize.height + margin * 2)
    val totalFabSizePx = with(LocalDensity.current) {
      Offset(totalFabSize.width.toPx(), totalFabSize.height.toPx())
    }
    val bounds = Offset(
      x = constraints.maxWidth - totalFabSizePx.x,
      y = constraints.maxHeight - totalFabSizePx.y
    )

    val fab = rememberFabState(bounds, totalFabSizePx)
    val isFabDisplayable = state.showFab &&
      !state.isInPictureInPictureMode &&
      bounds.x >= 0f &&
      bounds.y >= 0f

    val previousBounds = rememberPrevious(bounds)
    val velocityTracker = remember { ExpoVelocityTracker() }

    LaunchedEffect(state.isOpen) {
      if (state.isOpen) {
        fab.restingOffset = fab.animatedOffset.value
        val isOnLeftSide = fab.animatedOffset.value.x < fab.bounds.safe.x / 2f
        val offScreenX = if (isOnLeftSide) -totalFabSizePx.x else constraints.maxWidth.toFloat()
        fab.animatedOffset.animateTo(
          targetValue = Offset(offScreenX, fab.animatedOffset.value.y),
          animationSpec = tween(durationMillis = 500)
        )
        fab.isOffScreen = true
      } else if (fab.isOffScreen) {
        fab.animatedOffset.animateTo(
          targetValue = fab.restingOffset,
          animationSpec = spring(
            dampingRatio = 0.6f,
            stiffness = Spring.StiffnessLow
          )
        )
        fab.isOffScreen = false
        fab.onInteraction()
      }
    }

    LaunchedEffect(bounds.x, bounds.y, isFabDisplayable) {
      if (!isFabDisplayable) {
        return@LaunchedEffect
      }
      previousBounds?.let {
        val oldX = fab.animatedOffset.value.x
        val oldY = fab.animatedOffset.value.y
        val newX = (oldX / previousBounds.x) * fab.bounds.safe.x
        val newY = (oldY / previousBounds.y) * fab.bounds.safe.y
        val newTarget = calculateTargetPosition(
          currentPosition = Offset(newX, newY),
          velocity = ExpoVelocityTracker.PointF(0f, 0f),
          bounds = fab.bounds.safe,
          totalFabWidth = totalFabSizePx.x,
          minY = fab.bounds.safeMinY
        )

        fab.animatedOffset.snapTo(newTarget)
      }
    }

    AnimatedVisibility(
      visible = isFabDisplayable,
      enter = fadeIn(),
      exit = fadeOut()
    ) {
      Box(
        modifier = Modifier
          .offset { fab.animatedOffset.value.toIntOffset() }
          .size(totalFabSize)
          .padding(margin)
          .pointerInput(bounds.x, bounds.y) {
            coroutineScope {
              while (true) {
                awaitPointerEventScope {
                  val firstDown = awaitFirstDown(requireUnconsumed = false)
                  val pointerId = firstDown.id
                  fab.isPressed = true
                  fab.isDragging = false
                  fab.onInteraction()

                  launch {
                    fab.animatedOffset.stop()
                  }

                  var dragDistance = 0f
                  var dragOffset = fab.animatedOffset.value

                  drag(pointerId) { change ->
                    dragOffset = (dragOffset + change.positionChange())
                      .coerceIn(minX = -fab.bounds.halfFab.x, maxX = fab.bounds.drag.x, minY = -fab.bounds.halfFab.y, maxY = fab.bounds.drag.y)
                    dragDistance += change.positionChange().getDistance()
                    velocityTracker.registerPosition(dragOffset.x, dragOffset.y)

                    if (dragDistance > ClickDragTolerance) {
                      fab.isDragging = true
                      launch {
                        fab.animatedOffset.animateTo(dragOffset)
                      }
                    }
                  }

                  fab.isPressed = false
                  fab.isDragging = false
                  fab.onInteraction()

                  if (dragDistance < ClickDragTolerance) {
                    velocityTracker.clear()
                    onPress()
                  } else {
                    handleRelease(fab, velocityTracker, totalFabSizePx)
                  }
                }
              }
            }
          }
      ) {
        FloatingActionButtonContent(
          isPressed = fab.isPressed,
          isDragging = fab.isDragging,
          isIdle = fab.isIdle,
          modifier = Modifier.fillMaxSize()
        )
      }
    }
  }
}

/**
 * Handles the release of the FAB, calculating momentum and animating it to the nearest edge.
 */
private fun CoroutineScope.handleRelease(
  fab: FabState,
  velocityTracker: ExpoVelocityTracker,
  totalFabSizePx: Offset
) {
  val velocity = velocityTracker.calculateVelocity()
  val newOffset = calculateTargetPosition(fab.animatedOffset.value, velocity, fab.bounds.safe, totalFabSizePx.x, fab.bounds.safeMinY)

  velocityTracker.clear()
  launch {
    fab.animatedOffset.animateTo(
      targetValue = newOffset,
      animationSpec = spring(
        dampingRatio = 0.65f,
        stiffness = Spring.StiffnessLow
      ),
      initialVelocity = Offset(velocity.x, velocity.y)
    )
    fab.savePosition(newOffset)
  }
}
