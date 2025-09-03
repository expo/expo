package expo.modules.devlauncher.compose

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import expo.modules.devlauncher.compose.primitives.DefaultScaffold
import expo.modules.devlauncher.compose.routes.CrashReport
import expo.modules.devlauncher.compose.routes.CrashReportRoute
import expo.modules.devlauncher.compose.routes.DevelopmentServersRoute
import expo.modules.devlauncher.compose.routes.HomeRoute
import expo.modules.devlauncher.compose.routes.ProfileRoute
import expo.modules.devlauncher.compose.routes.Routes
import expo.modules.devlauncher.compose.routes.SettingsRoute
import expo.modules.devlauncher.compose.routes.UpdatesRoute
import expo.modules.devlauncher.compose.ui.BottomTabBar
import expo.modules.devlauncher.compose.ui.Full
import expo.modules.devlauncher.compose.ui.rememberBottomSheetState

@Composable
fun DevLauncherBottomTabsNavigator() {
  val mainNavController = rememberNavController()
  val bottomTabsNavController = rememberNavController()
  val profileBottomSheetState = rememberBottomSheetState()
  val developmentServersBottomSheetState = rememberBottomSheetState()

  val navigateToProfile = remember {
    { profileBottomSheetState.targetDetent = Full }
  }

  val openDevelopmentServers = remember {
    { developmentServersBottomSheetState.targetDetent = Full }
  }

  NavHost(
    navController = mainNavController,
    startDestination = Routes.Main
  ) {
    composable<Routes.Main>(
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
          startDestination = Routes.Home,
          enterTransition = {
            EnterTransition.None
          },
          exitTransition = {
            ExitTransition.None
          }
        ) {
          composable<Routes.Home> {
            HomeRoute(
              navController = mainNavController,
              onProfileClick = navigateToProfile,
              onDevServersClick = openDevelopmentServers
            )
          }
          composable<Routes.Updates> {
            UpdatesRoute(onProfileClick = navigateToProfile)
          }
          composable<Routes.Settings> {
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

  ProfileRoute(profileBottomSheetState)

  DevelopmentServersRoute(developmentServersBottomSheetState)
}
