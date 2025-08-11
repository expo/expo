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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.theme.Pallet
import expo.modules.devmenu.compose.theme.Theme
import kotlin.time.Duration
import kotlin.time.Duration.Companion.seconds

@Composable
fun CircularProgressBar(
  startAngle: Float = 270f,
  size: Dp = 96.dp,
  strokeWidth: Dp = size / 8,
  duration: Duration = 1.seconds
) {
  val backgroundColor = if (Theme.isDarkTheme) {
    Pallet.Dark.Gray.gray300
  } else {
    Pallet.Light.Gray.gray300
  }

  val progressColor = if (Theme.isDarkTheme) {
    Pallet.Dark.Blue.blue500
  } else {
    Pallet.Light.Blue.blue500
  }

  val transition = rememberInfiniteTransition(label = "infiniteSpinningTransition")

  val animatedProgress by transition.animateFloat(
    initialValue = 0f,
    targetValue = 1f,
    animationSpec = infiniteRepeatable(
      tween(duration.inWholeMilliseconds.toInt())
    ),
    label = "Progress Animation"
  )

  Canvas(modifier = Modifier.size(size)) {
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

    withTransform({
      rotate(degrees = startAngle, pivot = center)
    }) {
      drawArc(
        color = progressColor,
        startAngle = 0f,
        sweepAngle = animatedProgress * 360,
        useCenter = false,
        topLeft = Offset(strokeWidthPx / 2, strokeWidthPx / 2),
        size = Size(arcSize, arcSize),
        style = Stroke(width = strokeWidthPx, cap = StrokeCap.Round)
      )
    }
  }
}

@Preview
@Composable
fun CircularProgressBarPreview() {
  CircularProgressBar()
}
