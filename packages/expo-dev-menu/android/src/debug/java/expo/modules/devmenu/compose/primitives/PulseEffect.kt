package expo.modules.devmenu.compose.primitives

import androidx.compose.animation.core.DurationBasedAnimationSpec
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.runtime.getValue

@Composable
fun Modifier.pulseEffect(
  initialScale: Float = 1f,
  targetScale: Float = 2f,
  brush: Brush = SolidColor(Color.Black.copy(alpha = 0.3f)),
  shape: Shape = CircleShape,
  animationSpect: DurationBasedAnimationSpec<Float> = tween(durationMillis = 1200)
): Modifier {
  val transition = rememberInfiniteTransition(label = "pulseEffect")
  val scale by transition.animateFloat(
    initialValue = initialScale,
    targetValue = targetScale,
    animationSpec = infiniteRepeatable(animationSpect),
    label = "scale"
  )

  val alpha by transition.animateFloat(
    initialValue = 1f,
    targetValue = 0f,
    animationSpec = infiniteRepeatable(animationSpect),
    label = "alpha"
  )

  return this.drawBehind {
    val outline = shape.createOutline(size, layoutDirection, this)
    scale(scale) {
      drawOutline(outline, brush, alpha)
    }
  }
}
