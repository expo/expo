package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Icon
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

data class BundlerInfoState(
  val bundlerIp: String,
  val onCopy: () -> Unit = {}
)

@Composable
fun BundlerInfo(
  state: BundlerInfoState
) {
  val color = Theme.colors.status.success

  Column(
    modifier = Modifier
      .background(color = Theme.colors.background.default)
      .padding(horizontal = Theme.spacing.medium, vertical = Theme.spacing.small)
  ) {
    Text(
      "Connected to:",
      color = Theme.colors.text.secondary
    )

    Spacer(Modifier.size(Theme.spacing.small))

    Row(
      verticalAlignment = Alignment.CenterVertically,
      modifier = Modifier.fillMaxWidth()
    ) {
      Canvas(modifier = Modifier.size(10.dp)) {
        drawCircle(
          color = color,
          radius = 5.dp.toPx()
        )
      }

      Spacer(Modifier.size(Theme.spacing.small))

      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
          .fillMaxWidth()
      ) {
        // TODO(@lukmccall): Add mono font
        Text(
          state.bundlerIp,
          maxLines = 2,
          fontSize = Theme.typography.small
        )

        Row(
          horizontalArrangement = Arrangement.SpaceBetween
        ) {
          Icon(
            painterResource(R.drawable._expodevclientcomponents_assets_clipboardicon),
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
