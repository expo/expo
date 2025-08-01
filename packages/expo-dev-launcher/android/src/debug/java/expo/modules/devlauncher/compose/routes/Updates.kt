package expo.modules.devlauncher.compose.routes

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import expo.modules.devlauncher.compose.DefaultScreenContainer
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
        val viewModel = viewModel<BranchesViewModel>()

        if (viewModel.areUpdatesConfigured) {
          val state by viewModel.state.collectAsStateWithLifecycle()
          BranchesScreen(
            branches = state.branches,
            isLoading = state.isLoading,
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

      composable<Routes.Updates.Branch> { navBackStackEntry ->
        val route = navBackStackEntry.toRoute<Routes.Updates.Branch>()

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
    }
  }
}
