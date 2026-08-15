package expo.modules.devlauncher.compose.primitives

import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import io.github.lukmccall.colors.blue
import io.github.lukmccall.colors.gray
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

@Composable
fun CircularProgressBar(
  modifier: Modifier = Modifier,
  progress: Float? = null,
  startAngle: Float = 270f,
  size: Dp = 96.dp,
  strokeWidth: Dp = size / 8,
  duration: Duration = 1.seconds
) {
  val backgroundColor = NewAppTheme.pallet.gray.`3`
  val progressColor = NewAppTheme.pallet.blue.`8`

  val effectiveProgress = if (progress != null) {
    progress
  } else {
    val transition = rememberInfiniteTransition(label = "infiniteSpinningTransition")
    val animatedProgress by transition.animateFloat(
      initialValue = 0f,
      targetValue = 1f,
      animationSpec = infiniteRepeatable(
        tween(duration.inWholeMilliseconds.toInt())
      ),
      label = "Progress Animation"
    )
    animatedProgress
  }

  val determinateModifier = if (progress != null) {
    Modifier.graphicsLayer {
      alpha = progress
      rotationZ = progress * 270f
    }
  } else {
    Modifier
  }

  Canvas(
    modifier = Modifier
      .size(size)
      .then(determinateModifier)
      .then(modifier)
  ) {
    val strokeWidthPx = strokeWidth.toPx()
    val arcSize = size.toPx() - strokeWidthPx
    drawArc(
      color = backgroundColor,
      startAngle = 0f,
      sweepAngle = 360f,
      useCenter = false,
      // Offset Half Stroke Width
      topLeft = Offset(strokeWidthPx / 2, strokeWidthPx / 2),
      size = Size(arcSize, arcSize),
      style = Stroke(width = strokeWidthPx)
    )

    if (progress != null) {
      drawArc(
        color = progressColor,
        startAngle = 270f,
        sweepAngle = progress * 270f,
        useCenter = false,
        topLeft = Offset(strokeWidthPx / 2, strokeWidthPx / 2),
        size = Size(arcSize, arcSize),
        style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
      )
    } else {
      withTransform({
        rotate(degrees = startAngle, pivot = center)
      }) {
        drawArc(
          color = progressColor,
          startAngle = 0f,
          sweepAngle = effectiveProgress * 360,
          useCenter = false,
          topLeft = Offset(strokeWidthPx / 2, strokeWidthPx / 2),
          size = Size(arcSize, arcSize),
          style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
        )
      }
    }
  }
}

@Preview
@Composable
fun CircularProgressBarPreview() {
  CircularProgressBar()
}
