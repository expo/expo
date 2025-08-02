package expo.modules.devmenu.fab

import FloatingActionButtonContent
import android.annotation.SuppressLint
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationVector2D
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.VectorConverter
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.drag
import androidx.compose.foundation.interaction.MutableInteractionSource
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

private val FabDefaultSize = DpSize(48.dp, 92.dp)
private val Margin = 16.dp
private const val ClickDragTolerance = 40f

private typealias AnimatableOffset = Animatable<Offset, AnimationVector2D>

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
  onRefreshPress: () -> Unit = {},
  onOpenMenuPress: () -> Unit = {}
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

    val previousBounds = rememberPrevious(bounds)
    val velocityTracker = remember { ExpoVelocityTracker() }
    val defaultOffset = bounds.copy(y = bounds.y * 0.75f)
    val animatedOffset = remember { Animatable(defaultOffset, Offset.VectorConverter) }
    val pillInteractionSource = remember { MutableInteractionSource() }

    LaunchedEffect(bounds.x, bounds.y) {
      previousBounds?.let {
        val oldX = animatedOffset.value.x
        val oldY = animatedOffset.value.y
        val newX = (oldX / previousBounds.x) * bounds.x
        val newY = (oldY / previousBounds.y) * bounds.y
        val newTarget = calculateTargetPosition(
          currentPosition = Offset(newX, newY),
          velocity = ExpoVelocityTracker.PointF(0f, 0f),
          bounds = bounds,
          totalFabWidth = totalFabSizePx.x
        )

        animatedOffset.snapTo(newTarget)
      }
    }

    AnimatedVisibility(
      visible = state.showFab,
      enter = fadeIn(),
      exit = fadeOut()
    ) {
      Box(
        modifier = Modifier
          .offset { animatedOffset.value.toIntOffset() }
          .size(totalFabSize)
          .padding(margin)
          .pointerInput(bounds.x, bounds.y) {
            coroutineScope {
              while (true) {
                awaitPointerEventScope {
                  val firstDown = awaitFirstDown(requireUnconsumed = false)
                  val pointerId = firstDown.id

                  launch {
                    animatedOffset.stop()
                  }

                  var dragDistance = 0f
                  var dragOffset = animatedOffset.value

                  drag(pointerId) { change ->
                    dragOffset = (dragOffset + change.positionChange())
                      .coerceIn(maxX = bounds.x, maxY = bounds.y)
                    dragDistance += change.positionChange().getDistance()
                    velocityTracker.registerPosition(dragOffset.x, dragOffset.y)
                    change.consume()

                    if (dragDistance > ClickDragTolerance) {
                      launch {
                        animatedOffset.animateTo(dragOffset)
                      }
                    }
                  }
                  if (dragDistance < ClickDragTolerance) {
                    velocityTracker.clear()
                    launch {
                      pillInteractionSource.emitRelease(firstDown.position)
                    }
                  } else {
                    handleRelease(animatedOffset, velocityTracker, totalFabSizePx, bounds)
                  }
                }
              }
            }
          }
      ) {
        FloatingActionButtonContent(
          interactionSource = pillInteractionSource,
          onRefreshPress = onRefreshPress,
          onEllipsisPress = onOpenMenuPress,
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
  animatedOffset: AnimatableOffset,
  velocityTracker: ExpoVelocityTracker,
  totalFabSizePx: Offset,
  bounds: Offset
) {
  val velocity = velocityTracker.calculateVelocity()
  val newOffset = calculateTargetPosition(animatedOffset.value, velocity, bounds, totalFabSizePx.x)

  velocityTracker.clear()
  launch {
    animatedOffset.animateTo(
      targetValue = newOffset,
      animationSpec = spring(
        dampingRatio = 0.65f,
        stiffness = Spring.StiffnessLow
      ),
      initialVelocity = Offset(velocity.x, velocity.y)
    )
  }
}
