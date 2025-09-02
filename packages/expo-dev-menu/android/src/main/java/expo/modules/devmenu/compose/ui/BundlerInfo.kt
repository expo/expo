package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.utils.copyToClipboard

@Composable
fun BundlerInfo(
  bundlerIp: String
) {
  val context = LocalContext.current

  NewMenuButton(
    content = {
      Column(
        verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)
      ) {
        NewText(
          "Connected to:",
          color = NewAppTheme.colors.text.tertiary,
          style = NewAppTheme.font.sm.merge(
            fontWeight = FontWeight.Medium
          )
        )
        NewText(
          bundlerIp,
          style = NewAppTheme.font.md.merge(
            fontWeight = FontWeight.Medium
          )
        )
      }
    },
    rightComponent = {
      MenuIcons.Copy(
        size = 20.dp,
        tint = NewAppTheme.colors.icon.tertiary
      )
    },
    onClick = {
      copyToClipboard(
        context,
        label = "Bundler URL",
        text = bundlerIp
      )
    }
  )
}

@Composable
@Preview(
  widthDp = 300
)
fun BundlerInfoPreview() {
  BundlerInfo(
    bundlerIp = "http://10.0.2.2:8081"
  )
}
