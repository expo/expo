package expo.modules.devlauncher.compose

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import expo.modules.devlauncher.compose.primitives.DefaultScaffold
import expo.modules.devlauncher.compose.routes.CrashReport
import expo.modules.devlauncher.compose.routes.CrashReportRoute
import expo.modules.devlauncher.compose.routes.Home
import expo.modules.devlauncher.compose.routes.HomeRoute
import expo.modules.devlauncher.compose.routes.ProfileRoute
import expo.modules.devlauncher.compose.routes.Settings
import expo.modules.devlauncher.compose.routes.SettingsRoute
import expo.modules.devlauncher.compose.ui.BottomTabBar
import expo.modules.devlauncher.compose.ui.Full
import expo.modules.devlauncher.compose.ui.rememberBottomSheetState
import expo.modules.devmenu.compose.theme.Theme
import kotlinx.serialization.Serializable

@Composable
fun DefaultScreenContainer(
  content: @Composable () -> Unit
) {
  Box(
    modifier = Modifier
      .fillMaxSize()
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

@Serializable
object Main

@Composable
fun DevLauncherBottomTabsNavigator() {
  val mainNavController = rememberNavController()
  val bottomTabsNavController = rememberNavController()
  val bottomSheetState = rememberBottomSheetState()

  NavHost(
    navController = mainNavController,
    startDestination = Main
  ) {
    composable<Main>(
      enterTransition = {
        slideIntoContainer(
          AnimatedContentTransitionScope.SlideDirection.Right,
          animationSpec = tween(700)
        )
      },
      exitTransition = {
        slideOutOfContainer(
          AnimatedContentTransitionScope.SlideDirection.Left,
          animationSpec = tween(700)
        )
      }
    ) {
      DefaultScaffold(bottomTab = {
        BottomTabBar(bottomTabsNavController)
      }) {
        NavHost(
          navController = bottomTabsNavController,
          startDestination = Home,
          enterTransition = {
            EnterTransition.None
          },
          exitTransition = {
            ExitTransition.None
          }
        ) {
          composable<Home> {
            HomeRoute(navController = mainNavController, onProfileClick = { bottomSheetState.jumpTo(Full) })
          }
          composable<Settings> {
            SettingsRoute()
          }
        }
      }
    }

    composable<CrashReport>(
      enterTransition = {
        slideIntoContainer(
          AnimatedContentTransitionScope.SlideDirection.Left,
          animationSpec = tween(700)
        )
      },
      exitTransition = {
        slideOutOfContainer(
          AnimatedContentTransitionScope.SlideDirection.Right,
          animationSpec = tween(700)
        )
      }
    ) {
      CrashReportRoute()
    }
  }

  ProfileRoute(bottomSheetState)
}
