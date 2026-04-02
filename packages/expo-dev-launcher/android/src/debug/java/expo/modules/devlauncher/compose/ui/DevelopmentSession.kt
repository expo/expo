package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun DevelopmentSessionSection(
  isRefreshing: Boolean = false,
  onAction: (HomeAction) -> Unit = {}
) {
  RoundedSurface(
    borderRadius = NewAppTheme.borderRadius.xl,
    color = NewAppTheme.colors.background.subtle
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`),
      modifier = Modifier.padding(NewAppTheme.spacing.`3`)
    ) {
      DevelopmentSessionHelp()

      DevelopmentSessionActions(isRefreshing, showRefetchButton = true, onAction)
    }
  }
}

@Composable
fun DevelopmentSessionHelp() {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`)
  ) {
    NewText(
      "Start a local development server with:",
      color = NewAppTheme.colors.text.secondary,
      style = NewAppTheme.font.sm
    )

    RoundedSurface(
      color = NewAppTheme.colors.background.element,
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
      "Then, select the local server when it appears here.",
      color = NewAppTheme.colors.text.secondary,
      style = NewAppTheme.font.sm
    )
  }
}

@Composable
fun DevelopmentSessionActions(isRefreshing: Boolean = false, showRefetchButton: Boolean = false, onAction: (HomeAction) -> Unit) {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`)
  ) {
    ServerUrlInput(
      openApp = { urlValue ->
        onAction(HomeAction.OpenApp(urlValue))
      }
    )

    if (showRefetchButton) {
      NewText(
        "Or",
        color = NewAppTheme.colors.text.secondary,
        style = NewAppTheme.font.sm.merge(
          textAlign = TextAlign.Center
        ),
        modifier = Modifier.fillMaxWidth()
      )

      FetchDevelopmentServersButton(
        isFetching = isRefreshing,
        onAction = onAction
      )
    }

    if (!EmulatorUtilities.isRunningOnEmulator()) {
      NewText(
        "Or",
        color = NewAppTheme.colors.text.secondary,
        style = NewAppTheme.font.sm.merge(
          textAlign = TextAlign.Center
        ),
        modifier = Modifier.fillMaxWidth()
      )

      ScanQRCodeButton(onAction)
    }
  }
}

@Composable
fun EmbeddedBundleButton(
  onAction: (HomeAction) -> Unit
) {
  RoundedSurface(
    color = NewAppTheme.colors.background.element,
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Button(
      onClick = {
        onAction(HomeAction.LoadEmbeddedBundle)
      }
    ) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
          .fillMaxWidth()
          .padding(NewAppTheme.spacing.`3`)
      ) {
        NewText("Load embedded bundle")

        LauncherIcons.Download(
          size = 20.dp,
          tint = NewAppTheme.colors.icon.quaternary
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun DevelopmentSessionHelperPreview() {
  DevelopmentSessionSection()
}
