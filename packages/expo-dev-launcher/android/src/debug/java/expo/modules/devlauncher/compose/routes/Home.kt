package expo.modules.devlauncher.compose.routes

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeViewModel
import expo.modules.devlauncher.compose.screens.HomeScreen
import kotlinx.serialization.Serializable

@Serializable
object Home

@Composable
fun HomeRoute(
  navController: NavController,
  onProfileClick: () -> Unit
) {
  DefaultScreenContainer {
    val viewModel = viewModel<HomeViewModel>()
    HomeScreen(
      state = viewModel.state,
      onAction = { action ->
        when (action) {
          is HomeAction.NavigateToCrashReport -> navController.navigate(
            CrashReport.fromErrorInstance(action.crashReport)
          )

          else -> viewModel.onAction(action)
        }
      },
      onProfileClick = onProfileClick
    )
  }
}
