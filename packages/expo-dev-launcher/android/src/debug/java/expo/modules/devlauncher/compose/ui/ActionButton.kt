package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.composeunstyled.Button
import expo.modules.devmenu.compose.primitives.Heading
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
    shape = RoundedCornerShape(Theme.sizing.borderRadius.medium),
    backgroundColor = style.background
  ) {
    Box(
      contentAlignment = Alignment.Companion.Center,
      modifier = Modifier.Companion
        .padding(vertical = Theme.spacing.small)
        .fillMaxWidth()
    ) {
      Heading(text, color = style.foreground)
    }
  }
}
