package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun RowLayout(
  modifier: Modifier = Modifier,
  leftComponent: @Composable (() -> Unit)? = null,
  rightComponent: @Composable (() -> Unit)? = null,
  content: @Composable () -> Unit
) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = modifier
  ) {
    if (leftComponent != null) {
      leftComponent()

      Spacer(Modifier.size(Theme.spacing.small))
    }

    content()

    Spacer(Modifier.weight(1f))

    rightComponent?.invoke()
  }
}
