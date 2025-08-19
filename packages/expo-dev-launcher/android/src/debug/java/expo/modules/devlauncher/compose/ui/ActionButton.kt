package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import com.composeunstyled.Button
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.ripple.ripple
import expo.modules.devmenu.compose.theme.ButtonStyle
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun ActionButton(
  text: String,
  style: ButtonStyle,
  onClick: () -> Unit = {}
) {
  Button(
    onClick = onClick,
    shape = RoundedCornerShape(NewAppTheme.borderRadius.xl),
    backgroundColor = style.background,
    indication = ripple(color = style.foreground)
  ) {
    Box(
      contentAlignment = Alignment.Companion.Center,
      modifier = Modifier.Companion
        .padding(vertical = Theme.spacing.small)
        .fillMaxWidth()
    ) {
      NewText(
        text,
        color = style.foreground
      )
    }
  }
}

@Composable
fun ActionButton(
  text: String,
  foreground: Color,
  background: Color,
  modifier: Modifier = Modifier,
  fill: Boolean = true,
  borderRadius: Dp = NewAppTheme.borderRadius.xl,
  textStyle: TextStyle = NewAppTheme.font.lg.merge(
    fontWeight = FontWeight.SemiBold
  ),
  onClick: () -> Unit = {}
) {
  Button(
    onClick = onClick,
    shape = RoundedCornerShape(borderRadius),
    backgroundColor = background,
    indication = ripple(color = foreground)
  ) {
    Box(
      contentAlignment = Alignment.Center,
      modifier = Modifier
        .then(
          if (fill) {
            Modifier.fillMaxWidth()
          } else {
            Modifier
          }
        )
        .then(modifier)
    ) {
      NewText(
        text,
        color = foreground,
        style = textStyle
      )
    }
  }
}
