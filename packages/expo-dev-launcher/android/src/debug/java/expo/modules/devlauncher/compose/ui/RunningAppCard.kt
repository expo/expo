package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun RunningAppCard(
  appIp: String,
  appName: String? = null,
  onClick: (appIp: String) -> Unit = {}
) {
  val label = appName ?: appIp
  val description = if (appName != null) {
    appIp
  } else {
    null
  }

  Button(
    onClick = { onClick(appIp) },
    backgroundColor = Theme.colors.background.default
  ) {
    Column {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
          .padding(Theme.spacing.medium)
      ) {
        val iconColor = Theme.colors.status.success

        Canvas(
          modifier = Modifier
            .size(Theme.sizing.icon.extraSmall)
            .padding(Theme.spacing.micro)
        ) {
          drawCircle(
            color = iconColor,
            radius = size.minDimension / 2f
          )
        }
        Spacer(Theme.spacing.small)

        Text(label)

        Spacer(modifier = Modifier.weight(1f))

        Icon(
          painterResource(expo.modules.devmenu.R.drawable._expodevclientcomponents_assets_chevronrighticon),
          contentDescription = "Open app",
          tint = Theme.colors.icon.default,
          modifier = Modifier
            .size(Theme.sizing.icon.extraSmall)
        )
      }
      if (description != null) {
        Row {
          Spacer(Theme.spacing.small + Theme.sizing.icon.extraSmall)

          Text(
            text = description,
            fontSize = Theme.typography.small,
            color = Theme.colors.text.secondary,
            modifier = Modifier.padding(horizontal = Theme.spacing.small)
          )
        }
      }
    }
  }
}

@Preview
@Composable
fun RunningAppCardPreview() {
  RunningAppCard(
    appIp = "http://10.0.2.2:8081",
    appName = "Expo Dev Launcher"

  )
}
