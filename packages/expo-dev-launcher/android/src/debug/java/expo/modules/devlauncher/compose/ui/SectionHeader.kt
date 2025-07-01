package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun SectionHeader(
  title: String,
  leftIcon: @Composable (() -> Unit)? = null,
  rightIcon: @Composable (() -> Unit)? = null
) {
  Row(verticalAlignment = Alignment.CenterVertically) {
    leftIcon?.invoke()

    if (leftIcon != null) {
      Spacer(Theme.spacing.medium)
    }

    Heading(title, color = Theme.colors.text.secondary)

    Spacer(modifier = Modifier.weight(1f))

    rightIcon?.invoke()
  }
}

@Composable
@Preview(widthDp = 300, showBackground = true)
fun SectionHeaderPreview() {
  SectionHeader(
    title = "Development servers",
    leftIcon = {
      Image(
        painter = painterResource(R.drawable._expodevclientcomponents_assets_terminalicon),
        contentDescription = "Terminal Icon"
      )
    },
    rightIcon = {
      Image(
        painter = painterResource(R.drawable._expodevclientcomponents_assets_infoicon),
        contentDescription = "Terminal Icon"
      )
    }
  )
}
