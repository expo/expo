package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.graphics.drawable.toBitmap
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Surface
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AppInfo(
  appName: String,
  runtimeVersion: String? = null,
  sdkVersion: String? = null,
  onAction: DevMenuActionHandler = {}
) {
  val context = LocalContext.current
  val icon = context.applicationInfo.icon

  Row(
    verticalAlignment = Alignment.CenterVertically,
    modifier = Modifier
      .background(color = Theme.colors.background.default)
      .padding(vertical = Theme.spacing.medium)
  ) {
    Spacer(Modifier.size(Theme.spacing.medium))

    Surface(
      shape = RoundedCornerShape(if (icon == 0) {
        Theme.sizing.borderRadius.medium
      } else {
        Theme.sizing.borderRadius.full
      })
    ) {
      Box(
        modifier = Modifier
          .size(Theme.sizing.icon.extraLarge)
          .background(Theme.colors.background.secondary)
      ) {
        if (icon != 0) {
          // TODO(@lukmccall): It looks super weird to use the app icon as a bitmap here
          val image = remember {
            context.applicationInfo.loadIcon(context.packageManager).toBitmap().asImageBitmap()
          }
          Image(
            image,
            contentDescription = "App Icon",
            modifier = Modifier
              .size(Theme.sizing.icon.extraLarge)
              .scale(1.2f)
          )
        }
      }
    }

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
