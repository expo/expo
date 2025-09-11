package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.AppIcon
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun AppInfo(
  appName: String,
  modifier: Modifier = Modifier,
  runtimeVersion: String? = null,
  sdkVersion: String? = null,
  onAction: DevMenuActionHandler = {}
) {
  Row(
    verticalAlignment = Alignment.CenterVertically,
    horizontalArrangement = Arrangement.Center,
    modifier = modifier
  ) {
    AppIcon()

    Spacer(NewAppTheme.spacing.`3`)

    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)
    ) {
      NewText(
        appName,
        style = NewAppTheme.font.lg.merge(fontWeight = FontWeight.SemiBold)
      )

      if (runtimeVersion != null) {
        NewText(
          "Runtime version: $runtimeVersion",
          style = NewAppTheme.font.md,
          color = NewAppTheme.colors.text.secondary
        )
      } else if (sdkVersion != null) {
        NewText(
          "SDK version: $sdkVersion",
          style = NewAppTheme.font.md,
          color = NewAppTheme.colors.text.secondary
        )
      }
    }

    Spacer(modifier = Modifier.weight(1f))

    Button(
      onClick = {
        onAction(DevMenuAction.Close)
      },
      shape = RoundedCornerShape(NewAppTheme.borderRadius.full),
      backgroundColor = NewAppTheme.colors.background.element,
      modifier = Modifier
        .align(Alignment.CenterVertically)
        .size(36.dp)
    ) {
      MenuIcons.Close(
        size = 16.dp,
        tint = NewAppTheme.colors.icon.tertiary
      )
    }
  }
}

@Composable
@Preview(widthDp = 300, showBackground = true, backgroundColor = 0xFFFFFF)
fun AppInfoPreview() {
  Column {
    AppInfo(
      appName = "Expo App",
      runtimeVersion = "1.0.0"
    )

    Spacer(modifier = Modifier.size(30.dp))

    AppInfo(
      appName = "Expo App",
      sdkVersion = "1.0.0"
    )
  }
}
