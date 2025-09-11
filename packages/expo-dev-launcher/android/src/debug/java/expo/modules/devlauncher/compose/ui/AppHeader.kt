package expo.modules.devlauncher.compose.ui

import android.os.Build
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.composeunstyled.Button
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.compose.primitives.AsyncImage
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.AppIcon
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun AppHeader(
  onProfileClick: () -> Unit,
  modifier: Modifier = Modifier
) {
  val isRunningInPreview = Build.DEVICE == "layoutlib"
  if (isRunningInPreview) {
    // In the preview, we don't have access to the app service or session service.
    // We can use a placeholder app name and current account.
    AppHeader(
      appName = "Placeholder App",
      currentAccount = null,
      onProfileClick = onProfileClick
    )
    return
  }

  val appService = inject<AppService>()
  val sessionService = inject<SessionService>()

  val currentUser = sessionService.user.collectAsStateWithLifecycle()
  val user = currentUser.value

  AppHeader(
    modifier = modifier,
    appName = appService.applicationInfo.appName,
    currentAccount = when (user) {
      UserState.Fetching, UserState.LoggedOut -> null
      is UserState.LoggedIn -> user.selectedAccount
    },
    onProfileClick = onProfileClick
  )
}

@Composable
fun AppHeader(
  appName: String,
  modifier: Modifier = Modifier,
  currentAccount: MeQuery.Account? = null,
  onProfileClick: () -> Unit = {}
) {
  Row(
    horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`),
    verticalAlignment = Alignment.CenterVertically,
    modifier = modifier
  ) {
    AppIcon()

    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
      modifier = Modifier.weight(1f)
    ) {
      NewText(
        appName,
        style = NewAppTheme.font.lg.merge(
          fontWeight = FontWeight.SemiBold
        )
      )

      NewText(
        "Development Build",
        color = NewAppTheme.colors.text.secondary
      )
    }

    RoundedSurface(
      borderRadius = NewAppTheme.borderRadius.full,
      color = NewAppTheme.colors.background.element
    ) {
      Button(onClick = onProfileClick) {
        Box(
          modifier = Modifier.size(44.dp),
          contentAlignment = Alignment.Center
        ) {
          val profilePhoto = currentAccount?.ownerUserActor?.profilePhoto

          if (profilePhoto != null) {
            AsyncImage(
              url = profilePhoto
            )
          } else {
            LauncherIcons.User(
              size = 24.dp,
              tint = NewAppTheme.colors.icon.tertiary
            )
          }
        }
      }
    }
  }
}

@Composable
@Preview(showBackground = true, widthDp = 300)
fun AppHeaderPreview() {
  AppHeader(
    appName = "BareExpo",
    modifier = Modifier.padding(NewAppTheme.spacing.`4`)
  )
}
