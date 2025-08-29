package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.compose.currentBackStackEntryAsState
import expo.modules.devlauncher.compose.routes.Routes
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun BottomTabBar(
  navController: NavController
) {
  Box(
    contentAlignment = Alignment.Center
  ) {
    Row(
      horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`),
      modifier = Modifier
        .background(NewAppTheme.colors.background.default)
        .height(IntrinsicSize.Max)
        .navigationBarsPadding()
        .padding(horizontal = NewAppTheme.spacing.`3`)
    ) {
      val navBackStackEntry by navController.currentBackStackEntryAsState()
      val currentDestination = navBackStackEntry?.destination

      val button = @Composable { label: String,
                                 icon: @Composable (size: Dp, tint: Color) -> Unit,
                                 screen: Any ->
        val isSelected = currentDestination?.hasRoute(screen::class) == true
        BottomTabButton(
          label = label,
          icon = icon,
          modifier = Modifier
            .weight(1f)
            .fillMaxHeight(),
          isSelected = isSelected,
          onClick = {
            navController.navigate(screen) {
              popUpTo(navController.graph.id) { inclusive = true }
            }
          }
        )
      }

      button(
        "Home",
        { size, tint -> LauncherIcons.Home(size, tint) },
        Routes.Home
      )

      button(
        "Updates",
        { size, tint -> LauncherIcons.UpdatesNav(size, tint) },
        Routes.Updates
      )

      button(
        "Settings",
        { size, tint -> LauncherIcons.Settings(size, tint) },
        Routes.Settings
      )
    }
  }
}
