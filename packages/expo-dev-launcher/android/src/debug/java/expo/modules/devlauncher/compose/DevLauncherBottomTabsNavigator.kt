package expo.modules.devlauncher.compose

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import expo.modules.devlauncher.compose.primitives.DefaultScaffold
import expo.modules.devlauncher.compose.screens.HomeScreen
import expo.modules.devlauncher.compose.screens.Profile
import expo.modules.devlauncher.compose.screens.SettingsScreen
import expo.modules.devlauncher.compose.ui.BottomTabBar
import expo.modules.devlauncher.compose.ui.Full
import expo.modules.devlauncher.compose.ui.rememberBottomSheetState
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devmenu.compose.theme.Theme
import kotlinx.serialization.Serializable

@Serializable
object Home

@Serializable
object Settings

@Composable
fun DefaultScreenContainer(
  content: @Composable () -> Unit
) {
  val scrollState = rememberScrollState()

  Box(
    modifier = Modifier
      .fillMaxSize()
      .verticalScroll(scrollState)
      .background(Theme.colors.background.secondary)
  ) {
    content()
  }
}

data class Tab(
  val label: String,
  val icon: Painter,
  val screen: Any
)

data class DevLauncherState(
  val appName: String = "BareExpo",
  val runningPackagers: Set<PackagerInfo> = emptySet<PackagerInfo>(),
  val onAction: DevLauncherActionHandler = {}
)

@Composable
fun DevLauncherBottomTabsNavigator(
  state: DevLauncherState
) {
  val navController = rememberNavController()
  val bottomSheetState = rememberBottomSheetState()

  DefaultScaffold(bottomTab = {
    BottomTabBar(navController)
  }) {
    NavHost(
      navController = navController,
      startDestination = Home,
      enterTransition = {
        EnterTransition.None
      },
      exitTransition = {
        ExitTransition.None
      }
    ) {
      composable<Home> { DefaultScreenContainer { HomeScreen(state, onProfileClick = { bottomSheetState.jumpTo(Full) }) } }
      composable<Settings> { DefaultScreenContainer { SettingsScreen() } }
    }
  }

  Profile(bottomSheetState)
}
