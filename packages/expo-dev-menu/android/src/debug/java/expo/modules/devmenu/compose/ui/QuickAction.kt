package expo.modules.devmenu.compose.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun QuickAction(
  label: String,
  icon: @Composable () -> Unit,
  modifier: Modifier = Modifier,
  onClick: () -> Unit
) {
  NewMenuButton(
    modifier = modifier,
    icon = icon,
    content = {
      NewText(
        text = label,
        style = NewAppTheme.font.md.merge(fontWeight = FontWeight.Medium)
      )
    },
    onClick = onClick
  )
}
