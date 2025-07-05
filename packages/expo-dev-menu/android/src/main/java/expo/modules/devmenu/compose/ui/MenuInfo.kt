package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun MenuInfo(
  label: String,
  value: String
) {
  RowLayout(
    modifier = Modifier
      .background(Theme.colors.background.default)
      .padding(Theme.spacing.small),
    rightComponent = {
      Text(value)
    }
  ) {
    Text(
      label
    )
  }
}

@Composable
@Preview(widthDp = 300)
fun MenuInfoPreview() {
  MenuInfo(
    label = "Version",
    value = "1.0.0"
  )
}
