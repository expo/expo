package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.Shape
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun Surface(
  modifier: Modifier = Modifier,
  shape: Shape = RectangleShape,
  color: Color = Theme.colors.background.default,
  border: BorderStroke? = null,
  content: @Composable () -> Unit
) {
  Box(
    modifier = modifier
      .then(
        if (border != null) {
          Modifier.border(border, shape)
        } else {
          Modifier
        }
      )
      .background(color = color, shape = shape)
      .clip(shape),
    propagateMinConstraints = true
  ) {
    content()
  }
}

@Composable
fun RoundedSurface(
  modifier: Modifier = Modifier,
  shape: Shape = RoundedCornerShape(Theme.sizing.borderRadius.large),
  color: Color = Theme.colors.background.default,
  border: BorderStroke? = null,
  content: @Composable () -> Unit
) {
  Surface(
    modifier = modifier,
    shape = shape,
    color = color,
    border = border,
    content = content
  )
}
