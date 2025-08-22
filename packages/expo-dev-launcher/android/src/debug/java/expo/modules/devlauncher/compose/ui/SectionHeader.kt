package expo.modules.devlauncher.compose.ui

import androidx.compose.runtime.Composable
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun SectionHeader(
  title: String,
  leftIcon: @Composable (() -> Unit)? = null,
  rightIcon: @Composable (() -> Unit)? = null
) {
  RowLayout(
    rightComponent = rightIcon,
    leftComponent = leftIcon
  ) {
    Heading(title, color = Theme.colors.text.secondary)
  }
}
