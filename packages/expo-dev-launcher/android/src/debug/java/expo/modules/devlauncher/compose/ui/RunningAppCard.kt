package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.RowLayout
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
    Column(modifier = Modifier.padding(Theme.spacing.medium)) {
      RowLayout(
        leftComponent = {
          val iconColor = Theme.colors.status.success

          Box(
            modifier = Modifier.size(Theme.spacing.small).drawBehind {
              drawCircle(iconColor)
            }
          )
        },
        rightComponent = {
          Icon(
            painterResource(R.drawable.chevron_right_icon),
            contentDescription = "Open app",
            tint = Theme.colors.icon.default,
            modifier = Modifier
              .size(Theme.sizing.icon.extraSmall)
          )
        }
      ) {
        Column {
          Text(label)

          if (description != null) {
            Spacer(Theme.spacing.tiny)

            Text(
              text = description,
              fontSize = Theme.typography.small,
              color = Theme.colors.text.secondary
            )
          }
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
