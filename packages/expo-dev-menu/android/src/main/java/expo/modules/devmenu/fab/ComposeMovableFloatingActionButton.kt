package expo.modules.devmenu.fab

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.AnimationVector2D
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.VectorConverter
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.drag
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.positionChange
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.DevMenuState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import androidx.compose.runtime.LaunchedEffect
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.fab.ExpoVelocityTracker.PointF

private val FabSize = 56.dp
private val Margin = 16.dp
private const val ClickDragTolerance = 40f

private typealias AnimatableOffset = Animatable<Offset, AnimationVector2D>

/**
 * A floating action button that can be dragged across the screen and springs to the
 * nearest horizontal edge when released. A tap triggers the onClick action.
 */
@SuppressLint("UnusedBoxWithConstraintsScope")
@Composable
fun ComposeMovableFloatingActionButton(
  context: Context,
  state: DevMenuState,
  modifier: Modifier = Modifier,
  fabSize: Dp = FabSize,
  margin: Dp = Margin
) {
  BoxWithConstraints(modifier = modifier.fillMaxSize()) {
    val totalFabSize = fabSize + margin * 2
    val totalFabSizePx = with(LocalDensity.current) { totalFabSize.toPx() }
    val bounds = Offset(
      x = constraints.maxWidth - totalFabSizePx,
      y = constraints.maxHeight - totalFabSizePx
    )

    val previousBounds = rememberPrevious(bounds)

    // Use our velocity tracker. I couldn't get satisfying results with androidx.compose.ui.input.pointer.util.VelocityTracker
    val velocityTracker = ExpoVelocityTracker()

    /*
     * Reasoning for the default FAB position: I assume that we want the users to have to change the FAB position as seldom as possible.
     * Most of the time apps users (developers testing the app) will read app content that is displayed at around 1/3 of the height of the screen
     * therefore we probably don't want to have the FAB there because it will be in the way. We also can't it have at the very bottom, because it will often
     * collide with the bottom tabs. For the very top of the screen - we will collide with screen headers. 75% of the height of the screen seems like a
     * reasonable default spot. We keep it on the right to make it easier to press for right-handed people.
     */
    val defaultOffset = bounds.copy(y = bounds.y * 0.75f)
    val animatedOffset = remember {
      Animatable(defaultOffset, Offset.VectorConverter)
    }

    LaunchedEffect(bounds.x, bounds.y) {
      previousBounds?.let {
        val oldX = animatedOffset.value.x
        val oldY = animatedOffset.value.y
        val newX = (oldX / previousBounds.x) * bounds.x
        val newY = (oldY / previousBounds.y) * bounds.y
        val newTarget = calculateTargetPosition(
          currentPosition = Offset(newX, newY),
          velocity = PointF(0f, 0f),
          bounds = bounds,
          totalFabSizePx = totalFabSizePx
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
          .shadow(8.dp, CircleShape)
          .clip(CircleShape)
          .clickable {}
          .background(Color.White)
          .pointerInput(bounds.x, bounds.y) {
            coroutineScope {
              while (true) {
                awaitPointerEventScope {
                  // React to the first touch down event
                  val pointerId = awaitFirstDown().id

                  launch {
                    animatedOffset.stop()
                  }

                  // React to drag
                  var dragDistance = 0f
                  var dragOffset = animatedOffset.value

                  drag(pointerId) { change ->
                    dragOffset = (dragOffset + change.positionChange())
                      .coerceIn(maxX = bounds.x, maxY = bounds.y)
                    dragDistance += change.positionChange().getDistance()
                    velocityTracker.registerPosition(dragOffset.x, dragOffset.y)
                    change.consume()

                    // Only start moving after sufficient drag
                    if (dragDistance > ClickDragTolerance) {
                      launch {
                        animatedOffset.animateTo(dragOffset)
                      }
                    }
                  }

                  // React to touch release
                  if (dragDistance < ClickDragTolerance) {
                    DevMenuManager.openMenu(context as Activity)
                    velocityTracker.clear()
                  } else {
                    handleRelease(
                      animatedOffset,
                      velocityTracker,
                      totalFabSizePx,
                      bounds
                    )
                  }
                }
              }
            }
          },
        contentAlignment = Alignment.Center
      ) {
        Image(
          // TODO: @behenate Get a proper icon for the dev menu.
          painter = painterResource(id = R.drawable.home_icon),
          contentDescription = "Pull up the dev menu"
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
  totalFabSizePx: Float,
  bounds: Offset
) {
  val velocity = velocityTracker.calculateVelocity()
  val newOffset = calculateTargetPosition(animatedOffset.value, velocity, bounds, totalFabSizePx)

  velocityTracker.clear()
  launch {
    animatedOffset.animateTo(
      targetValue = newOffset,
      animationSpec = spring(
        dampingRatio = Spring.DampingRatioLowBouncy, // Spring.DampingRatioLowBouncy > 0.65f > Spring.DampingRatioMediumBouncy
        stiffness = Spring.StiffnessLow
      ),
      initialVelocity = Offset(velocity.x, velocity.y)
    )
  }
}
