package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.primitives.Mono
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.primitives.pulseEffect
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.utils.copyToClipboard

data class BundlerInfoState(
  val bundlerIp: String,
  val onCopy: () -> Unit = {}
)

@Composable
fun BundlerInfo(
  state: BundlerInfoState
) {
  val context = LocalContext.current
  val color = Theme.colors.status.success

  Column(
    modifier = Modifier
      .background(color = Theme.colors.background.default)
      .padding(horizontal = Theme.spacing.medium)
  ) {
    Spacer(Modifier.size(Theme.spacing.small))

    Text(
      "Connected to:",
      color = Theme.colors.text.secondary
    )

    RoundedSurface {
      Button(
        onClick = {
          copyToClipboard(context, label = "Bundler URL", text = state.bundlerIp)
        }
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Theme.spacing.small)
        ) {
          Spacer(Modifier.size(Theme.spacing.small))

          Box(
            modifier = Modifier
              .size(Theme.spacing.small)
              .drawBehind {
                drawCircle(
                  color = color,
                  radius = size.minDimension / 2f
                )
              }
              .pulseEffect(
                initialScale = 0.95f,
                targetScale = 2f,
                brush = SolidColor(color)
              )
          )

          Spacer(Modifier.size(Theme.spacing.small))

          Row(
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
              .fillMaxWidth()
          ) {
            Mono(
              state.bundlerIp,
              maxLines = 2,
              fontSize = Theme.typography.small
            )

            Row(
              horizontalArrangement = Arrangement.SpaceBetween
            ) {
              Icon(
                painterResource(R.drawable.clip_board_icon),
                contentDescription = "Share",
                tint = Theme.colors.icon.default,
                modifier = Modifier
                  .size(Theme.spacing.large)
              )

              Spacer(Modifier.size(Theme.spacing.small))
            }
          }
        }
      }
    }
  }
}

@Composable
@Preview(
  widthDp = 300
)
fun BundlerInfoPreview() {
  BundlerInfo(
    state = BundlerInfoState(
      bundlerIp = "http://10.0.2.2:8081"
    )
  )
}
