package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun ScreenHeaderContainer(
  modifier: Modifier = Modifier,
  content: @Composable RowScope.() -> Unit
) {
  Row(
    verticalAlignment = Alignment.Companion.CenterVertically,
    modifier = Modifier
      .fillMaxWidth()
      .statusBarsPadding()
      .then(modifier)
  ) {
    content()
  }
}
