package expo.modules.devlauncher.compose.routes

import androidx.compose.runtime.Composable
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.screens.SettingsScreen
import kotlinx.serialization.Serializable

@Serializable
object Settings

@Composable
fun SettingsRoute() {
  DefaultScreenContainer {
    SettingsScreen()
  }
}
