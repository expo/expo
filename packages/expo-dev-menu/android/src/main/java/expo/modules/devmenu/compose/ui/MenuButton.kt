package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun MenuButton(
  label: String,
  labelTextColor: Color? = null,
  leftIcon: Painter? = null,
  rightIcon: Painter? = null,
  enabled: Boolean = true,
  onClick: () -> Unit = {}
) {
  MenuButton(
    label = label,
    labelTextColor = labelTextColor,
    leftComponent = leftIcon?.let {
      @Composable {
        DayNighIcon(
          painter = it,
          contentDescription = label,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )
      }
    },
    rightComponent = rightIcon?.let {
      @Composable {
        DayNighIcon(
          painter = it,
          contentDescription = null,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )
      }
    },
    enabled = enabled,
    onClick = onClick
  )
}

@Composable
fun MenuButton(
  label: String,
  labelTextColor: Color? = null,
  leftComponent: (@Composable () -> Unit)? = null,
  rightComponent: (@Composable () -> Unit)? = null,
  enabled: Boolean = true,
  onClick: () -> Unit = {}
) {
  Button(
    enabled = enabled,
    onClick = onClick,
    backgroundColor = Theme.colors.background.default
  ) {
    RowLayout(
      modifier = Modifier
        .padding(Theme.spacing.small),
      leftComponent = leftComponent,
      rightComponent = rightComponent
    ) {
      Text(
        label,
        color = labelTextColor
      )
    }
  }
}

@Composable
@Preview(widthDp = 300)
fun MenuButtonPreview() {
  MenuButton(
    label = "Menu Button",
    leftIcon = painterResource(R.drawable.refresh_icon)
  )
}
