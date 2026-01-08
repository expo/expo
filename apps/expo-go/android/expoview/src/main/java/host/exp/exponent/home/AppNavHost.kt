package host.exp.exponent.home

import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import host.exp.expoview.R
import kotlinx.serialization.Serializable

@Serializable
sealed interface Destination {
    @Serializable
    object Home : Destination

    @Serializable
    object Settings : Destination

    @Serializable
    object Projects : Destination

    @Serializable
    class ProjectDetails(val appId: String) : Destination

    @Serializable
    object Snacks : Destination

    @Serializable
    object Account : Destination

    @Serializable
    class Branches(val appId: String) : Destination

    @Serializable
    class BranchDetails(val branchName: String, val appId: String) : Destination
}

data class BottomBarDestination(
    val destination: Destination,
    val label: String,
    val contentDescription: String,
    val icon: Int
)

val bottomBarDestinations = listOf(
    BottomBarDestination(
        Destination.Home,
        "Home",
        "Home",
        R.drawable.home
    ),
    BottomBarDestination(
        Destination.Settings,
        "Settings",
        "Settings",
        R.drawable.settings
    )
)


@Composable
fun RootNavigation() {
    val navController = rememberNavController()
    val viewModel: HomeAppViewModel = viewModel<HomeAppViewModel>()
    val themeSetting by viewModel.selectedTheme.collectAsState()

    HomeAppTheme(themeSetting = themeSetting) {
        AppNavHost(
            navController = navController,
            startDestination = Destination.Home,
            viewModel = viewModel
        )
    }
}

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: Destination,
    viewModel: HomeAppViewModel
) {
    val selectedAccount by viewModel.selectedAccount.collectAsState()
    val context = LocalContext.current

    @Composable
    fun NavAccountHeaderAction() {
        AccountHeaderAction(
            account = selectedAccount,
            onLoginClick = { viewModel.login(context) },
            onAccountClick = { navController.navigate(Destination.Account) }
        )
        Spacer(Modifier.padding(8.dp))
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable<Destination.Home> {
            HomeScreen(
                viewModel = viewModel,
                navigateToProjects = { navController.navigate(Destination.Projects) },
                navigateToSnacks = { navController.navigate(Destination.Snacks) },
                navigateToProjectDetails = { appId ->
                    navController.navigate(Destination.ProjectDetails(appId = appId))
                },
                bottomBar = {
                    BottomBar(
                        navController = navController,
                        currentDestination = Destination.Home,
                    )
                },
                accountHeader = { NavAccountHeaderAction() }
            )
        }

        NavHost(
            navController = navController,
            startDestination = startDestination
        ) {
            composable<Destination.Home> {
                HomeScreen(
                    viewModel = viewModel,
                    navigateToProjects = { navController.navigate(Destination.Projects) },
                    navigateToSnacks = { navController.navigate(Destination.Snacks) },
                    navigateToProjectDetails = { appId ->
                        navController.navigate(Destination.ProjectDetails(appId = appId))
                    },
                    bottomBar = {
                        BottomBar(
                            navController = navController,
                            currentDestination = Destination.Home,
                        )
                    },
                    accountHeader = { NavAccountHeaderAction() },
                    navigateToLogin = {
                        viewModel.login(context)
                    }
                )
            }

            composable<Destination.Settings> {
                SettingsScreen(
                    viewModel = viewModel,
                    bottomBar = {
                        BottomBar(
                            navController = navController,
                            currentDestination = Destination.Settings,
                        )
                    },
                    accountHeader = { NavAccountHeaderAction() }
                )
            }

            composable<Destination.Projects> {
                ProjectsScreen(
                    viewModel = viewModel,
                    onGoBack = { navController.popBackStack() },
                    bottomBar = {
                        BottomBar(
                            navController = navController,
                            currentDestination = Destination.Home, // Or another default
                        )
                    },
                    navigateToProjectDetails = { appId ->
                        navController.navigate(Destination.ProjectDetails(appId = appId))
                    }
                )
            }

            composable<Destination.Snacks> {
                SnacksScreen(
                    viewModel = viewModel,
                    onGoBack = { navController.popBackStack() },
                    bottomBar = {
                        BottomBar(
                            navController = navController,
                            currentDestination = Destination.Home,
                        )
                    }
                )
            }

            composable<Destination.Account> {
                AccountScreen(
                    viewModel = viewModel,
                    goBack = { navController.popBackStack() },
                )
            }

            composable<Destination.ProjectDetails> { backStackEntry ->
                val args = backStackEntry.toRoute<Destination.ProjectDetails>()
                val appFlow = remember { viewModel.app(args.appId) }
                ProjectDetailsScreen(
                    viewModel = viewModel,
                    onGoBack = { navController.popBackStack() },
                    appFlow = appFlow,
                    onBranchClick = { branchName ->
                        navController.navigate(
                            Destination.BranchDetails(
                                branchName = branchName,
                                appId = args.appId
                            )
                        )
                    },
                    onShowAllBranchesClick = {
                        navController.navigate(Destination.Branches(appId = args.appId))
                    },
                )
            }

            composable<Destination.Branches> { backStackEntry ->
                val args = backStackEntry.toRoute<Destination.Branches>()

                BranchesScreen(
                    viewModel = viewModel,
                    onGoBack = { navController.popBackStack() },
                    appId = args.appId,
                    navigateToBranchDetails = { appId, branchName ->
                        navController.navigate(Destination.BranchDetails(branchName, appId))
                    },
                    bottomBar = {
                        BottomBar(
                            navController = navController,
                            currentDestination = Destination.Home, // Or another default
                        )
                    }
                )
            }

            composable<Destination.BranchDetails> { backStackEntry ->
                val args = backStackEntry.toRoute<Destination.BranchDetails>()
                val branchRefreshableFlow = remember(args.branchName, args.appId) {
                    viewModel.branch(args.branchName, args.appId)
                }

                // --- Start of Fix ---
                BranchDetailsScreen(
                    onGoBack = { navController.popBackStack() },
                    branchRefreshableFlow = branchRefreshableFlow,
                    // Pass the BottomBar composable here
                    bottomBar = {
                        BottomBar(
                            navController = navController,
                            currentDestination = Destination.Home // Or another appropriate default
                        )
                    }
                )
                // --- End of Fix ---
            }
        }

        composable<Destination.Projects> {
            ProjectsScreen(
                viewModel = viewModel,
                onGoBack = { navController.popBackStack() },
                bottomBar = {
                    BottomBar(
                        navController = navController,
                        currentDestination = Destination.Home, // Or another default
                    )
                },
                navigateToProjectDetails = { appId ->
                    navController.navigate(Destination.ProjectDetails(appId = appId))
                }
            )
        }

        composable<Destination.Snacks> {
            SnacksScreen(
                viewModel = viewModel,
                onGoBack = { navController.popBackStack() },
                bottomBar = {
                    BottomBar(
                        navController = navController,
                        currentDestination = Destination.Home,
                    )
                }
            )
        }

        composable<Destination.Account> {
            AccountScreen(
                viewModel = viewModel,
                goBack = { navController.popBackStack() },
            )
        }

        composable<Destination.ProjectDetails> { backStackEntry ->
            val args = backStackEntry.toRoute<Destination.ProjectDetails>()
            val appFlow = remember { viewModel.app(args.appId) }
            ProjectDetailsScreen(
                viewModel = viewModel,
                onGoBack = { navController.popBackStack() },
                appFlow = appFlow,
                onBranchClick = { branchName ->
                    navController.navigate(
                        Destination.BranchDetails(
                            branchName = branchName,
                            appId = args.appId
                        )
                    )
                },
                onShowAllBranchesClick = {
                    navController.navigate(Destination.Branches(appId = args.appId))
                },
            )
        }

        composable<Destination.Branches> { backStackEntry ->
            val args = backStackEntry.toRoute<Destination.Branches>()

            BranchesScreen(
                viewModel = viewModel,
                onGoBack = { navController.popBackStack() },
                appId = args.appId,
                navigateToBranchDetails = { appId, branchName ->
                    navController.navigate(Destination.BranchDetails(branchName, appId))
                },
                bottomBar = {
                    BottomBar(
                        navController = navController,
                        currentDestination = Destination.Home, // Or another default
                    )
                }
            )
        }

        composable<Destination.BranchDetails> { backStackEntry ->
            val args = backStackEntry.toRoute<Destination.BranchDetails>()
            val branchRefreshableFlow = remember(args.branchName, args.appId) {
                viewModel.branch(args.branchName, args.appId)
            }

            // --- Start of Fix ---
            BranchDetailsScreen(
                onGoBack = { navController.popBackStack() },
                branchRefreshableFlow = branchRefreshableFlow,
                // Pass the BottomBar composable here
                bottomBar = {
                    BottomBar(
                        navController = navController,
                        currentDestination = Destination.Home // Or another appropriate default
                    )
                }
            )
            // --- End of Fix ---
        }
    }
}

@Composable
fun BottomBar(
    navController: NavHostController,
    currentDestination: Destination,
) {
    NavigationBar(
        windowInsets = NavigationBarDefaults.windowInsets,
        containerColor = MaterialTheme.colorScheme.surface,
    ) {
        bottomBarDestinations.forEach { item ->
            NavigationBarItem(
                selected = currentDestination == item.destination,
                onClick = {
                    navController.navigate(item.destination) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(
                        painter = painterResource(item.icon),
                        contentDescription = item.contentDescription
                    )
                },
                label = { Text(item.label) }
            )
        }
    }
}
}
