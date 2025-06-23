package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun BottomTabButton(
  label: String,
  icon: Painter,
  isSelected: Boolean,
  modifier: Modifier = Modifier,
  onClick: () -> Unit
) {
  Button(onClick = onClick, modifier = modifier) {
    Column(horizontalAlignment = Alignment.Companion.CenterHorizontally, modifier = Modifier.Companion.padding(Theme.spacing.small)) {
      Icon(
        painter = icon,
        tint = if (isSelected) {
          Theme.colors.button.primary.background
        } else {
          Theme.colors.icon.default
        },
        contentDescription = "$label Icon"
      )
      Spacer(Theme.spacing.tiny)
      Text(
        "Home",
        fontSize = Theme.typography.small,
        color = if (isSelected) {
          Theme.colors.button.primary.background
        } else {
          Theme.colors.text.secondary
        }
      )
    }
  }
}
