package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Dialog
import com.composables.core.DialogPanel
import com.composables.core.Icon
import com.composables.core.Scrim
import com.composables.core.rememberDialogState
import com.composeunstyled.Button
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.HomeAction
import expo.modules.devlauncher.compose.HomeState
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.DevelopmentSessionHelper
import expo.modules.devlauncher.compose.ui.RunningAppCard
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.ui.SectionHeader
import expo.modules.devlauncher.compose.ui.ServerUrlInput
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.MenuButton

@Composable
fun HomeScreen(
  state: HomeState,
  onAction: (HomeAction) -> Unit,
  onProfileClick: () -> Unit
) {
  val hasPackager = state.runningPackagers.isNotEmpty()
  val dialogState = rememberDialogState(initiallyVisible = false)

  Dialog(state = dialogState) {
    Scrim()

    DialogPanel(
      modifier = Modifier
        .displayCutoutPadding()
        .systemBarsPadding()
        .clip(RoundedCornerShape(12.dp))
        .background(Theme.colors.background.default)
    ) {
      Column {
        RowLayout(
          rightComponent = {
            Button(onClick = {
              dialogState.visible = false
            }) {
              Icon(
                painterResource(R.drawable._expodevclientcomponents_assets_xicon),
                contentDescription = "Close dialog"
              )
            }
          },
          modifier = Modifier.padding(Theme.spacing.medium)
        ) {
          Heading("Development servers")
        }

        Divider()

        Row(modifier = Modifier.padding(Theme.spacing.medium)) {
          DevelopmentSessionHelper()
        }
      }
    }
  }

  Column {
    ScreenHeaderContainer(modifier = Modifier.padding(Theme.spacing.medium)) {
      AppHeader(
        appName = state.appName,
        currentAccount = state.currentAccount,
        onProfileClick = onProfileClick
      )
    }

    Column(
      modifier = Modifier
        .padding(horizontal = Theme.spacing.medium)
    ) {
      Spacer(Theme.spacing.large)

      Row {
        Spacer(Theme.spacing.small)

        SectionHeader(
          "Development servers",
          leftIcon = {
            Image(
              painter = painterResource(R.drawable._expodevclientcomponents_assets_terminalicon),
              contentDescription = "Terminal Icon"
            )
          },
          rightIcon = {
            if (hasPackager) {
              Button(onClick = {
                dialogState.visible = true
              }) {
                Image(
                  painter = painterResource(R.drawable._expodevclientcomponents_assets_infoicon),
                  contentDescription = "Terminal Icon"
                )
              }
            }
          }
        )
      }

      Spacer(Theme.spacing.small)

      RoundedSurface {
        Column {
          if (hasPackager) {
            for (packager in state.runningPackagers) {
              RunningAppCard(
                appIp = packager.url,
                appName = packager.description
              ) {
                onAction(HomeAction.OpenApp(packager.url))
              }
              Divider()
            }
          } else {
            Box(modifier = Modifier.padding(Theme.spacing.medium)) {
              DevelopmentSessionHelper()
            }
            Divider()
          }

          MenuButton(
            onClick = {
              onAction(HomeAction.RefetchRunningApps)
            },
            enabled = !state.isFetchingPackagers,
            label = if (state.isFetchingPackagers) {
              "Searching for development servers..."
            } else {
              "Fetch development servers"
            }
          )

          Accordion("Enter URL manually", initialState = false) {
            Column {
              Spacer(Theme.spacing.tiny)

              ServerUrlInput(
                openApp = { urlValue ->
                  onAction(HomeAction.OpenApp(urlValue))
                }
              )

              Spacer(Theme.spacing.small)
            }
          }
        }
      }

      Spacer(Theme.spacing.medium)
    }
  }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
  HomeScreen(state = HomeState(), onAction = {}, onProfileClick = {})
}
