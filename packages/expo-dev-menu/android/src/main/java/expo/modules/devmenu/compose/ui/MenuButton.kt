package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.Image
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
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun MenuButton(
  label: String,
  labelTextColor: Color? = null,
  icon: Painter? = null,
  rightIcon: Painter? = null,
  enabled: Boolean = true,
  onClick: () -> Unit = {}
) {
  Button(
    enabled = enabled,
    onClick = onClick,
    backgroundColor = Theme.colors.background.default
  ) {
    val leftIcon = icon?.let {
      @Composable {
        Image(
          painter = it,
          contentDescription = label,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )
      }
    }

    val rightIcon = rightIcon?.let {
      @Composable {
        Image(
          painter = it,
          contentDescription = null,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )
      }
    }

    RowLayout(
      modifier = Modifier
        .padding(Theme.spacing.small),
      leftComponent = leftIcon,
      rightComponent = rightIcon
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
    icon = painterResource(R.drawable._expodevclientcomponents_assets_refreshicon)
  )
}
