package expo.modules.devlauncher.compose

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideIn
import androidx.compose.animation.slideOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
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
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

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

  val isVisible by (DevLauncherController.instance as DevLauncherController).isLoadingToBundler

  AnimatedVisibility(
    visible = isVisible,
    enter = fadeIn(animationSpec = tween(durationMillis = 300)),
    exit = fadeOut(animationSpec = tween(durationMillis = 300))
  ) {
    Box(
      modifier = Modifier
        .fillMaxSize()
        .background(Color.Black.copy(alpha = 0.6f))
        .clickable(
          interactionSource = remember { MutableInteractionSource() },
          indication = null,
          onClick = {
            // Captures all clicks to block interaction with the underlying screen
          }
        )
    ) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
          .align(Alignment.BottomStart)
          .animateEnterExit(
            enter = slideIn(
              animationSpec = tween(durationMillis = 300),
              initialOffset = { fullSize -> IntOffset(-fullSize.height, fullSize.width) }
            ),
            exit = slideOut(
              animationSpec = tween(durationMillis = 300),
              targetOffset = { fullSize -> IntOffset(fullSize.height, fullSize.width) }
            )
          )
          .clip(RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
          .background(NewAppTheme.colors.background.element)
          .fillMaxWidth()
          .navigationBarsPadding()
          .padding(NewAppTheme.spacing.`3`)
          .padding(top = NewAppTheme.spacing.`1`)
      ) {
        NewText(
          "Connecting to the development server...",
          style = NewAppTheme.font.md.copy(
            fontWeight = FontWeight.SemiBold
          )
        )

        CircularProgressBar(
          size = 20.dp
        )
      }
    }
  }
}
