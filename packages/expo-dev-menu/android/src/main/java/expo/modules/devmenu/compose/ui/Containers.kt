package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun MenuContainer(
  content: @Composable () -> Unit
) {
  RoundedSurface {
    Column {
      content()
    }
  }
}
