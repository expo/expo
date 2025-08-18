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
import androidx.compose.ui.res.painterResource
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.compose.currentBackStackEntryAsState
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.Tab
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

      val buttonModifier = Modifier
        .weight(1f)
        .fillMaxHeight()
      val icons = listOf(
        Tab(
          label = "Home",
          icon = painterResource(id = R.drawable.home),
          screen = Routes.Home
        ),
        Tab(
          label = "Updates",
          icon = painterResource(id = R.drawable.reload),
          screen = Routes.Updates
        ),
        Tab(
          label = "Settings",
          icon = painterResource(id = R.drawable.settings),
          screen = Routes.Settings
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
}
