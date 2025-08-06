package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devmenu.compose.primitives.Mono
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun DevelopmentSessionHelper() {
  Column {
    Text("Start a local development server with:")

    Spacer(Theme.spacing.small)

    RoundedSurface(
      color = Theme.colors.background.secondary,
      border = BorderStroke(
        width = Theme.sizing.border.default,
        color = Theme.colors.border.default
      ),
      modifier = Modifier
        .fillMaxWidth()
    ) {
      Box(modifier = Modifier.padding(Theme.spacing.medium)) {
        Mono("npx expo start", fontSize = Theme.typography.small)
      }
    }

    Spacer(Theme.spacing.small)

    Text("Then, select the local server when it appears here.")
  }
}

@Preview(showBackground = true)
@Composable
fun DevelopmentSessionHelperPreview() {
  DevelopmentSessionHelper()
}
