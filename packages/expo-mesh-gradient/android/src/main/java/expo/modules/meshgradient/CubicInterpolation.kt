package expo.modules.meshgradient

import androidx.compose.ui.graphics.Color
import kotlin.math.pow

fun cubic(a: Color, b: Color, t: Float): Color {
  // Smoothstep Cubic Polynomial function
  val easedT = 3 * t.pow(2) - 2 * t.pow(3)

  return Color(
    red = a.red * (1 - easedT) + b.red * easedT,
    green = a.green * (1 - easedT) + b.green * easedT,
    blue = a.blue * (1 - easedT) + b.blue * easedT,
    alpha = a.alpha * (1 - easedT) + b.alpha * easedT
  )
}
