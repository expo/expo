package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import expo.modules.devmenu.compose.primitives.Surface
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun MenuSectionContainer(
  content: @Composable () -> Unit
) {
  Column(
    modifier = Modifier
      .padding(horizontal = Theme.spacing.small)
  ) {
    content()
  }
}

@Composable
fun MenuButtonContainer(
  content: @Composable () -> Unit
) {
  MenuSectionContainer {
    Surface(
      shape = RoundedCornerShape(Theme.sizing.borderRadius.large)
    ) {
      Column {
        content()
      }
    }
  }
}
