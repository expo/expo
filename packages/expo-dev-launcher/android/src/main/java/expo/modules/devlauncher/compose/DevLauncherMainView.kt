package expo.modules.devlauncher.compose

import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.SubcomposeLayout
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.util.fastMaxBy
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devlauncher.compose.screens.HomeScreen
import expo.modules.devlauncher.compose.screens.HomeScreenState
import expo.modules.devlauncher.compose.screens.SettingsScreen
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme
import kotlinx.serialization.Serializable

@Composable
fun Scaffold(
  bottomTab: @Composable () -> Unit = {},
  content: @Composable () -> Unit
) {
  SubcomposeLayout { constraints ->
    val maxWidth = constraints.maxWidth
    val maxHeight = constraints.maxHeight

    val bottomTabPlaceables = subcompose("bottomTab", bottomTab).map { it.measure(constraints) }
    val bottomTabsHeight = bottomTabPlaceables.fastMaxBy { it.height }?.height ?: 0
    val contentPlaceables = subcompose("content", content).map { it.measure(constraints.copy(maxHeight = maxHeight - bottomTabsHeight)) }

    layout(maxWidth, maxHeight) {
      contentPlaceables.forEach { it.place(0, 0) }
      bottomTabPlaceables.forEach { it.place(0, maxHeight - it.height) }
    }
  }
}

@Serializable
object Home

@Serializable
object Settings

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

@Composable
fun BottomTabButton(
  label: String,
  icon: Painter,
  isSelected: Boolean,
  modifier: Modifier = Modifier,
  onClick: () -> Unit
) {
  Button(onClick = onClick, modifier = modifier) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(Theme.spacing.small)) {
      Icon(
        painter = icon,
        tint = if (isSelected) {
          Theme.colors.button.primary.background
        } else {
          Theme.colors.icon.default
        },
        contentDescription = "$label Icon"
      )
      Spacer(Theme.spacing.tiny)
      Text(
        "Home",
        fontSize = Theme.typography.small,
        color = if (isSelected) {
          Theme.colors.button.primary.background
        } else {
          Theme.colors.text.secondary
        }
      )
    }
  }
}

data class Tab(
  val label: String,
  val icon: Painter,
  val screen: Any
)

@Composable
fun DevMenuLauncherMainView() {
  val navController = rememberNavController()

  Scaffold(bottomTab = {
    Box(
      contentAlignment = Alignment.Center
    ) {
      Row(
        modifier = Modifier
          .background(Theme.colors.background.default)
          .height(IntrinsicSize.Max)
      ) {
        val navBackStackEntry by navController.currentBackStackEntryAsState()
        val currentDestination = navBackStackEntry?.destination

        val buttonModifier = Modifier
          .weight(1f)
          .fillMaxHeight()
        val icons = listOf<Tab>(
          Tab(
            label = "Home",
            icon = painterResource(id = expo.modules.devlauncher.R.drawable._expodevclientcomponents_assets_homefilledinactiveicon),
            screen = Home
          ),
          Tab(
            label = "Settings",
            icon = painterResource(id = expo.modules.devlauncher.R.drawable._expodevclientcomponents_assets_settingsfilledinactiveicon),
            screen = Settings
          )
        )
        for (tab in icons) {
          val isSelected = currentDestination?.hasRoute(tab.screen::class) == true
          BottomTabButton(
            label = tab.label,
            icon = tab.icon,
            modifier = buttonModifier,
            isSelected = isSelected,
            onClick = {
              navController.navigate(tab.screen) {
                popUpTo(navController.graph.id) { inclusive = true }
              }
            }
          )
        }
      }
    }
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
      composable<Home> { DefaultScreenContainer { HomeScreen(HomeScreenState(appName = "BareExpo")) } }
      composable<Settings> { DefaultScreenContainer { SettingsScreen() } }
    }
  }
}

@Composable
@Preview(showBackground = true)
fun DevLauncherMainViewPreview() {
  DevMenuLauncherMainView()
}
