package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devmenu.compose.fromHex
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.pulseEffect

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

  RoundedSurface(
    borderRadius = NewAppTheme.borderRadius.xl,
    color = NewAppTheme.colors.background.subtle
  ) {
    Button(
      onClick = { onClick(appIp) }
    ) {
      Row(
        horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(NewAppTheme.spacing.`3`)
      ) {
        val dotColor = Color.fromHex("#34C759")
        Box(
          modifier = Modifier
            .size(12.dp)
            .drawBehind {
              drawCircle(dotColor)
            }
            .pulseEffect(
              brush = SolidColor(dotColor.copy(alpha = 0.3f))
            )
        )

        Column(
          verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
          modifier = Modifier.weight(1f)
        ) {
          NewText(
            label,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            style = NewAppTheme.font.lg.merge(
              fontWeight = if (appName != null) {
                FontWeight.SemiBold
              } else {
                FontWeight.Normal
              }
            )
          )

          if (description != null) {
            NewText(
              description,
              maxLines = 1,
              overflow = TextOverflow.Ellipsis,
              style = NewAppTheme.font.sm,
              color = NewAppTheme.colors.text.tertiary
            )
          }
        }

        LauncherIcons.Chevron(
          size = 20.dp,
          tint = NewAppTheme.colors.icon.quaternary
        )
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
