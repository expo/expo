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
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.composables.core.SheetDetent.Companion.Hidden
import expo.modules.devlauncher.compose.primitives.Scaffold
import expo.modules.devlauncher.compose.screens.HomeScreen
import expo.modules.devlauncher.compose.screens.HomeScreenState
import expo.modules.devlauncher.compose.screens.SettingsScreen
import expo.modules.devlauncher.compose.screens.SingUp
import expo.modules.devlauncher.compose.ui.BottomSheet
import expo.modules.devlauncher.compose.ui.BottomTabBar
import expo.modules.devlauncher.compose.ui.Full
import expo.modules.devlauncher.compose.ui.rememberBottomSheetState
import expo.modules.devmenu.compose.theme.AppTheme
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

@Composable
fun DevLauncherBottomTabsNavigator() {
  val navController = rememberNavController()

  val bottomSheetState = rememberBottomSheetState()

  Scaffold(bottomTab = {
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
      composable<Home> { DefaultScreenContainer { HomeScreen(HomeScreenState(appName = "BareExpo", onProfileClick = { bottomSheetState.jumpTo(Full) })) } }
      composable<Settings> { DefaultScreenContainer { SettingsScreen() } }
    }
  }

  BottomSheet(bottomSheetState) {
    SingUp(onClose = {
      bottomSheetState.targetDetent = Hidden
    })
  }
}

@Composable
@Preview(showBackground = true)
fun DevLauncherBottomTabsNavigatorPreview() {
  AppTheme {
    DevLauncherBottomTabsNavigator()
  }
}
