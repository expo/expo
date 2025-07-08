package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun SectionHeader(
  title: String,
  leftIcon: @Composable (() -> Unit)? = null,
  rightIcon: @Composable (() -> Unit)? = null
) {
  RowLayout(
    rightComponent = rightIcon,
    leftComponent = leftIcon
  ) {
    Heading(title, color = Theme.colors.text.secondary)
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
