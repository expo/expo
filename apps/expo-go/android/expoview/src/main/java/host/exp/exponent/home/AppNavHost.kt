package host.exp.exponent.home

import androidx.compose.foundation.layout.Spacer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.composable
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.setValue
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import host.exp.expoview.R

enum class Destination(
    val route: String,
    val label: String,
    val contentDescription: String,
    val icon: Int? = null,

) {
    HOME("home", "Home",  "Home", icon = R.drawable.home),
    SETTINGS("settings", "Settings",  "Settings", icon = R.drawable.settings),
    PROJECTS("projects", "Projects",  "Projects"),
    SNACKS("snacks", "Snacks", "Snacks"),
    ACCOUNT("account", "Account", "Account")
}


@Composable
fun RootNavigation() {

    val navController = rememberNavController()
    val startDestination = Destination.HOME

    val viewModel : HomeAppViewModel = viewModel<HomeAppViewModel>()

    AppNavHost(
        navController = navController,
        startDestination = startDestination,
        viewModel = viewModel
    )
}



@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: Destination,
    viewModel: HomeAppViewModel
) {
    val selectedAccount by viewModel.selectedAccount.collectAsState()
    val context = LocalContext.current

    @Composable fun NavAccountHeaderAction() {
        AccountHeaderAction(
            account = selectedAccount,
            onLoginClick = { viewModel.login(context) },
            onAccountClick = { navController.navigate(Destination.ACCOUNT.route) })
        Spacer(Modifier.padding(8.dp))
    }

    NavHost(
        navController,
        startDestination = startDestination.route
    ) {
        Destination.entries.forEach { destination ->
            composable(destination.route) {
                when (destination) {
                    Destination.HOME -> HomeScreen(
                        viewModel = viewModel,
                        navigateToProjects = { navController.navigate("projects") },
                        navigateToSnacks = { navController.navigate("snacks") },
                        bottomBar = {
                            BottomBar(
                                selectedDestination = Destination.HOME,
                                navigateToDestination = { destination ->
                                    navController.navigate(destination.route)
                                })
                        },
                        accountHeader = { NavAccountHeaderAction() }

                    )
//                        Destination.SETTINGS -> HomeScreen(viewModel= viewModel)
                    Destination.SETTINGS -> SettingsScreen(
                        viewModel = viewModel,
                        bottomBar = {
                            BottomBar(
                                selectedDestination = Destination.SETTINGS,
                                navigateToDestination = { destination ->
                                    navController.navigate(destination.route)
                                })
                        },
                        accountHeader = {
                            NavAccountHeaderAction()
                        }
                    )
                    Destination.PROJECTS -> ProjectsScreen(
                        viewModel = viewModel,
                        onGoBack = { navController.popBackStack() },
                        bottomBar = {
                            BottomBar(
                                selectedDestination = Destination.HOME,
                                navigateToDestination = { destination ->
                                    navController.navigate(destination.route)
                                })
                        }
                    )
                    Destination.SNACKS -> SnacksScreen(
                        viewModel = viewModel,
                        onGoBack = { navController.popBackStack() },
                        bottomBar = {
                            BottomBar(
                                selectedDestination = Destination.HOME,
                                navigateToDestination = { destination ->
                                    navController.navigate(destination.route)
                                })
                        }
                    )
                    Destination.ACCOUNT -> AccountScreen(
                            viewModel = viewModel,
                        goBack = { navController.popBackStack() },
                    )
                }
            }
        }

    }
}

@Composable
fun BottomBar(
    selectedDestination: Destination,
    navigateToDestination: (destination: Destination) -> Unit
) {
    NavigationBar(
        windowInsets = NavigationBarDefaults.windowInsets,
        containerColor = NewAppTheme.colors.background.default,
        contentColor = NewAppTheme.colors.background.subtle
    ) {
        Destination.entries.filter { it == Destination.HOME || it == Destination.SETTINGS }.forEach { destination ->
            NavigationBarItem(
                selected = selectedDestination == destination,
                onClick = {
                    navigateToDestination(destination)
                },
                icon = {
                    if(destination.icon != null) {
                        Icon(
                            painter = painterResource(destination.icon),
                            contentDescription = destination.contentDescription
                        )
                    }
                },
                label = { Text(destination.label) }
            )
        }
    }
}