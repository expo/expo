package expo.modules.devlauncher.compose.routes

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.BranchViewModel
import expo.modules.devlauncher.compose.models.BranchesAction
import expo.modules.devlauncher.compose.models.BranchesViewModel
import expo.modules.devlauncher.compose.screens.BranchScreen
import expo.modules.devlauncher.compose.screens.BranchesScreen
import expo.modules.devlauncher.compose.screens.NoUpdatesScreen

@Composable
fun UpdatesRoute(
  onProfileClick: () -> Unit
) {
  val updatesNavController = rememberNavController()

  DefaultScreenContainer {
    NavHost(
      navController = updatesNavController,
      startDestination = Routes.Updates.Branches,
      enterTransition = {
        slideIntoContainer(
          AnimatedContentTransitionScope.SlideDirection.Up,
          animationSpec = tween(400)
        )
      },
      exitTransition = {
        slideOutOfContainer(
          AnimatedContentTransitionScope.SlideDirection.Down,
          animationSpec = tween(400)
        )
      }
    ) {
      composable<Routes.Updates.Branches> {
        Branches(onProfileClick, updatesNavController)
      }

      composable<Routes.Updates.Branch> { navBackStackEntry ->
        val route = navBackStackEntry.toRoute<Routes.Updates.Branch>()
        Branch(route, updatesNavController)
      }
    }
  }
}

@Composable
private fun Branch(route: Routes.Updates.Branch, updatesNavController: NavHostController) {
  val viewModel = viewModel {
    BranchViewModel(
      branchName = route.name
    )
  }

  val state by viewModel.state.collectAsStateWithLifecycle()

  BranchScreen(
    branchName = route.name,
    updates = state.updates,
    isLoading = state.isLoading,
    goBack = { updatesNavController.navigateUp() },
    onAction = viewModel::onAction
  )
}

@Composable
private fun Branches(onProfileClick: () -> Unit, updatesNavController: NavHostController) {
  val viewModel = viewModel<BranchesViewModel>()

  val state by viewModel.state.collectAsStateWithLifecycle()

  if (viewModel.areUpdatesConfigured) {
    BranchesScreen(
      branches = state.branches,
      isLoading = state.isLoading,
      needToSignIn = state.needToSignIn,
      onProfileClick = onProfileClick,
      onAction = { action ->
        when (action) {
          is BranchesAction.OpenBranch -> {
            updatesNavController.navigate(
              Routes.Updates.Branch(action.branchName)
            )
          }

          else -> {
            viewModel.onAction(action)
          }
        }
      }
    )
  } else {
    NoUpdatesScreen(
      onProfileClick = onProfileClick
    )
  }
}
