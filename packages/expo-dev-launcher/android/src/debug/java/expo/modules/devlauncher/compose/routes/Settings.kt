package expo.modules.devlauncher.compose.routes

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.SettingsViewModel
import expo.modules.devlauncher.compose.screens.SettingsScreen

@Composable
fun SettingsRoute() {
  DefaultScreenContainer {
    val viewModel = viewModel<SettingsViewModel>()
    SettingsScreen(
      state = viewModel.state,
      onAction = viewModel::onAction
    )
  }
}
