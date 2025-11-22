package expo.modules.devlauncher.compose.routes

import android.widget.Toast
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeViewModel
import expo.modules.devlauncher.compose.screens.HomeScreen

@Composable
fun HomeRoute(
  navController: NavController,
  onProfileClick: () -> Unit,
  onDevServersClick: () -> Unit
) {
  DefaultScreenContainer {
    val viewModel = viewModel<HomeViewModel>()
    val context = LocalContext.current

    HomeScreen(
      state = viewModel.state,
      onAction = { action ->
        when (action) {
          is HomeAction.NavigateToCrashReport -> navController.navigate(
            CrashReport.fromErrorInstance(action.crashReport)
          )

          HomeAction.ScanQRCode -> {
            viewModel.scanQRCode(
              context = context,
              onResult = { scannedUrl ->
                viewModel.onAction(HomeAction.OpenApp(scannedUrl))
              },
              onError = { error ->
                Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
              }
            )
          }

          else -> viewModel.onAction(action)
        }
      },
      onProfileClick = onProfileClick,
      onDevServersClick = onDevServersClick
    )
  }
}
