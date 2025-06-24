package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun MenuButton(
  label: String,
  labelTextColor: Color? = null,
  icon: Painter? = null,
  rightIcon: Painter? = null,
  onClick: () -> Unit = {}
) {
  Button(
    onClick = onClick,
    backgroundColor = Theme.colors.background.default
  ) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      modifier = Modifier
        .padding(Theme.spacing.small)
    ) {
      if (icon != null) {
        Image(
          painter = icon,
          contentDescription = label,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )

        Spacer(Modifier.size(Theme.spacing.small))
      }

      Text(
        label,
        color = labelTextColor
      )

      Spacer(Modifier.weight(1f))

      if (rightIcon != null) {
        Image(
          painter = rightIcon,
          contentDescription = null,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )
      }
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
