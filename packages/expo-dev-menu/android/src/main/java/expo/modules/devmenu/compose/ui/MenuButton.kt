package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer

typealias NewMenuButtonComposable = (@Composable () -> Unit)

@Composable
fun NewMenuButton(
  modifier: Modifier = Modifier,
  icon: NewMenuButtonComposable? = null,
  content: NewMenuButtonComposable? = null,
  rightComponent: NewMenuButtonComposable? = null,
  withSurface: Boolean = true,
  enabled: Boolean = true,
  spacedBy: Dp = NewAppTheme.spacing.`2`,
  onClick: () -> Unit = {}
) {
  val contentComponent = @Composable {
    Button(onClick = onClick, enabled = enabled) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(spacedBy),
        modifier = Modifier
          .background(NewAppTheme.colors.background.subtle)
          .padding(NewAppTheme.spacing.`3`)
          .sizeIn(minHeight = 32.dp)
      ) {
        icon?.invoke()
        content?.invoke()
        Spacer(modifier = Modifier.weight(1f))
        rightComponent?.invoke()
      }
    }
  }

  if (withSurface) {
    RoundedSurface(
      borderRadius = NewAppTheme.borderRadius.xl,
      modifier = modifier
    ) {
      contentComponent()
    }
  } else {
    Box(modifier = modifier) {
      contentComponent()
    }
  }
}
