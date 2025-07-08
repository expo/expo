package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import com.composeunstyled.TextField
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.DevLauncherAction
import expo.modules.devlauncher.compose.DevLauncherState
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.RunningAppCard
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.ui.SectionHeader
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun HomeScreen(state: DevLauncherState, onProfileClick: () -> Unit) {
  Column {
    ScreenHeaderContainer(modifier = Modifier.padding(Theme.spacing.medium)) {
      AppHeader(state.appName, onProfileClick = onProfileClick)
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
            Image(
              painter = painterResource(R.drawable._expodevclientcomponents_assets_infoicon),
              contentDescription = "Terminal Icon"
            )
          }
        )
      }

      Spacer(Theme.spacing.small)

      RoundedSurface {
        Column {
          for (packager in state.runningPackagers) {
            RunningAppCard(
              appIp = packager.url
            ) {
              state.onAction(DevLauncherAction.OpenApp(packager.url))
            }
            Divider()
          }

          Accordion("Enter URL manually", initialState = false) {
            val url = remember { mutableStateOf("") }

            Column {
              Spacer(Theme.spacing.tiny)

              TextField(
                url.value,
                onValueChange = { newValue ->
                  url.value = newValue
                },
                placeholder = "http://10.0.2.2:8081",
                textStyle = Theme.typography.medium.font,
                maxLines = 1,
                modifier = Modifier
                  .border(
                    width = Theme.sizing.border.default,
                    shape = RoundedCornerShape(Theme.sizing.borderRadius.small),
                    color = Theme.colors.border.default
                  )
                  .padding(Theme.spacing.small),
                keyboardOptions = KeyboardOptions(
                  capitalization = KeyboardCapitalization.None,
                  autoCorrectEnabled = false,
                  keyboardType = KeyboardType.Uri
                )
              )

              Spacer(Theme.spacing.tiny)

              Button(onClick = {
                state.onAction(DevLauncherAction.OpenApp(url.value))
              }, modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(vertical = Theme.spacing.small)) {
                  Text("Connect")
                }
              }

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
  HomeScreen(state = DevLauncherState(), onProfileClick = {})
}
