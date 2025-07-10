package expo.modules.devlauncher.compose.routes

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.HomeViewModel
import expo.modules.devlauncher.compose.screens.HomeScreen
import kotlinx.serialization.Serializable

@Serializable
object Home

@Composable
fun HomeRoute(onProfileClick: () -> Unit) {
  DefaultScreenContainer {
    val viewModel = viewModel<HomeViewModel>()
    HomeScreen(
      state = viewModel.state,
      onAction = viewModel::onAction,
      onProfileClick = onProfileClick
    )
  }
}
