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
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.AppHeaderContainer
import expo.modules.devlauncher.compose.ui.SectionHeader
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.MenuButton

data class HomeScreenState(
  val appName: String,
  val onProfileClick: () -> Unit = {}
)

@Composable
fun HomeScreen(state: HomeScreenState) {
  Column {
    AppHeaderContainer {
      AppHeader(state.appName, onProfileClick = state.onProfileClick)
    }

    Column(
      modifier = Modifier
        .padding(horizontal = Theme.spacing.medium)
    ) {
      Spacer(Theme.spacing.large)

      Row {
        Spacer(Theme.spacing.small)

        SectionHeader(
          "Development",
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
          MenuButton("http://10.0.2.2:8081")
          Divider()
          MenuButton("Fetch development")
          Divider()
          Accordion("Enter URL", initialState = false) {
            val url = remember { mutableStateOf("") }

            Column {
              Spacer(Theme.spacing.tiny)

              TextField(
                url.value,
                onValueChange = { newValue ->
                  url.value = newValue
                },
                placeholder = "http://10.0.2.2:801",
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

              Button(onClick = {}, modifier = Modifier.fillMaxWidth()) {
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
  HomeScreen(state = HomeScreenState("BareExpo"))
}
