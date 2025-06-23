package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.primitives.AppIcon
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AppInfo(
  appName: String,
  runtimeVersion: String? = null,
  sdkVersion: String? = null,
  onAction: DevMenuActionHandler = {}
) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier
      .background(color = Theme.colors.background.default)
      .padding(vertical = Theme.spacing.medium)
  ) {
    Spacer(Modifier.size(Theme.spacing.medium))

    AppIcon()

    Spacer(Modifier.size(Theme.spacing.small))

    Column {
      Heading(
        appName
      )

      if (runtimeVersion != null) {
        Spacer(Modifier.size(Theme.spacing.tiny))
        Text(
          "Runtime version: $runtimeVersion",
          fontSize = Theme.typography.small,
          color = Theme.colors.text.secondary
        )
      }

      if (sdkVersion != null) {
        Spacer(Modifier.size(Theme.spacing.tiny))
        Text(
          "SDK version: $sdkVersion",
          fontSize = Theme.typography.small,
          color = Theme.colors.text.secondary
        )
      }
    }

    Spacer(Modifier.weight(1f))

    Button(
      onClick = {
        onAction(DevMenuAction.Close)
      },
      indication = ripple(),
      shape = RoundedCornerShape(Theme.sizing.borderRadius.full),
      modifier = Modifier
        .align(Alignment.Top)
    ) {
      Icon(
        painterResource(R.drawable._expodevclientcomponents_assets_xicon),
        contentDescription = "Close",
        tint = Theme.colors.button.ghost.foreground,
        modifier = Modifier
          .size(Theme.sizing.icon.small)
      )
    }
    Spacer(Modifier.size(Theme.spacing.medium))
  }
}

@Composable
@Preview(widthDp = 300, showBackground = false)
fun AppInfoPreview() {
  Column {
    AppInfo(
      appName = "Expo App",
      runtimeVersion = "1.0.0"
    )

    Spacer(Modifier.size(30.dp))

    AppInfo(
      appName = "Expo App",
      sdkVersion = "1.0.0"
    )
  }
}
