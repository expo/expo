package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun Divider(
  thickness: Dp = Dp.Hairline,
  color: Color = NewAppTheme.colors.border.default
) {
  Canvas(Modifier.fillMaxWidth().height(thickness)) {
    drawLine(
      color = color,
      strokeWidth = thickness.toPx(),
      start = Offset(0f, thickness.toPx() / 2),
      end = Offset(size.width, thickness.toPx() / 2)
    )
  }
}
