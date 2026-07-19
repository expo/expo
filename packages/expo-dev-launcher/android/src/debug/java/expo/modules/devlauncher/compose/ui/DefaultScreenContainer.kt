package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun DefaultScreenContainer(
  content: @Composable () -> Unit
) {
  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(NewAppTheme.colors.background.default)
      .statusBarsPadding()
  ) {
    content()
  }
}
