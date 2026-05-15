package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun FetchDevelopmentServersButton(
  isFetching: Boolean,
  onAction: (HomeAction) -> Unit
) {
  RoundedSurface(
    color = NewAppTheme.colors.background.element,
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Button(
      onClick = {
        onAction(HomeAction.RefreshServers)
      },
      enabled = !isFetching
    ) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
          .fillMaxWidth()
          .padding(NewAppTheme.spacing.`3`)
      ) {
        NewText(
          if (isFetching) {
            "Searching for development servers..."
          } else {
            "Fetch development servers"
          }
        )

        if (isFetching) {
          CircularProgressBar(size = 20.dp)
        } else {
          LauncherIcons.Download(
            size = 20.dp,
            tint = NewAppTheme.colors.icon.quaternary
          )
        }
      }
    }
  }
}
