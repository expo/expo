package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun ScreenHeaderContainer(
  backgroundColor: Color = Theme.colors.background.default,
  modifier: Modifier = Modifier,
  content: @Composable () -> Unit
) {
  Row(
    verticalAlignment = Alignment.Companion.CenterVertically,
    modifier = Modifier
      .fillMaxWidth()
      .background(backgroundColor)
      .statusBarsPadding()
      .then(modifier)
  ) {
    content()
  }
}
