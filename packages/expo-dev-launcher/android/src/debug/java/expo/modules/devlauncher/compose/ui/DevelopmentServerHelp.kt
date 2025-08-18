package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun DevelopmentSessionHelper() {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`)
  ) {
    NewText(
      "Start a local development server with:"
    )

    RoundedSurface(
      color = NewAppTheme.colors.background.subtle,
      border = BorderStroke(
        width = 1.dp,
        color = NewAppTheme.colors.border.default
      ),
      modifier = Modifier
        .fillMaxWidth()
    ) {
      Box(modifier = Modifier.padding(NewAppTheme.spacing.`3`)) {
        NewText(
          "npx expo start",
          style = NewAppTheme.font.md.merge(
            fontFamily = NewAppTheme.font.mono
          )
        )
      }
    }

    NewText(
      "Then, select the local server when it appears here."
    )
  }
}

@Preview(showBackground = true)
@Composable
fun DevelopmentSessionHelperPreview() {
  DevelopmentSessionHelper()
}
