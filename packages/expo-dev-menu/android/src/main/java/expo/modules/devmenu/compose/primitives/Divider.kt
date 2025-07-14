package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun Divider() {
  val thickness = Theme.sizing.border.hairlineWidth
  val color = Theme.colors.border.default
  Canvas(Modifier.fillMaxWidth().height(thickness)) {
    drawLine(
      color = color,
      strokeWidth = thickness.toPx(),
      start = Offset(0f, thickness.toPx() / 2),
      end = Offset(size.width, thickness.toPx() / 2)
    )
  }
}
