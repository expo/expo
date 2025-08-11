package expo.modules.devmenu.fab

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.IntOffset
import expo.modules.devmenu.fab.ExpoVelocityTracker.PointF
import kotlin.math.roundToInt

/**
 * Finds an appropriate resting position for the fab based on it's position velocity and size.
 */
internal fun calculateTargetPosition(
  currentPosition: Offset,
  velocity: PointF,
  bounds: Offset,
  totalFabWidth: Float
): Offset {
  // Simulate the bubble keeping the movement momentum
  // I've found that these values feel good (assume that the bubble keeps the momentum for ~100ms)
  val momentumOffsetX = velocity.x / 10f
  val momentumOffsetY = velocity.y / 10f
  val offsetXWithMomentumEstimate = currentPosition.x + totalFabWidth / 2 + momentumOffsetX
  val targetX = if (offsetXWithMomentumEstimate < bounds.x / 2) {
    0f
  } else {
    bounds.x
  }
  val targetY = currentPosition.y + momentumOffsetY
  val newOffset = Offset(targetX, targetY)
    .coerceIn(maxX = bounds.x, maxY = bounds.y)
  return newOffset
}

internal fun Offset.toIntOffset(): IntOffset {
  return IntOffset(
    this.x.roundToInt(),
    this.y.roundToInt()
  )
}

internal fun Offset.coerceIn(minX: Float = 0f, maxX: Float, minY: Float = 0f, maxY: Float): Offset {
  return this.copy(
    x = this.x.coerceIn(minX, maxX),
    y = this.y.coerceIn(minY, maxY)
  )
}

@Composable
internal fun <T> rememberPrevious(current: T): T? {
  val previousRef = remember { mutableStateOf<T?>(null) }

  LaunchedEffect(current) {
    previousRef.value = current
  }

  return previousRef.value
}

internal suspend fun MutableInteractionSource.emitRelease(pressPosition: Offset) {
  val pressInteraction = PressInteraction.Press(pressPosition)
  this.emit(PressInteraction.Release(pressInteraction))
}
