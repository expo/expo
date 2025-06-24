package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun Spacer(
  height: Dp = Theme.spacing.medium,
  modifier: Modifier? = null
) {
  androidx.compose.foundation.layout.Spacer(
    modifier = Modifier.then(
      modifier ?: Modifier.size(height)
    )
  )
}
