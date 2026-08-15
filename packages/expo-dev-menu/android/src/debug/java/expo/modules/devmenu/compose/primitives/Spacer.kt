package expo.modules.devmenu.compose.primitives

import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun Spacer(
  height: Dp = NewAppTheme.spacing.`2`,
  modifier: Modifier? = null
) {
  androidx.compose.foundation.layout.Spacer(
    modifier = Modifier.then(
      modifier ?: Modifier.size(height)
    )
  )
}
