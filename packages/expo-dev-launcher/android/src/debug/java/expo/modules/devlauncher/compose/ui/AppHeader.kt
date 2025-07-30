package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.composeunstyled.Button
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.R
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import expo.modules.devmenu.compose.primitives.AppIcon
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Surface
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AppHeader(onProfileClick: () -> Unit) {
  val isRunningInPreview = android.os.Build.DEVICE == "layoutlib"
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
  currentAccount: MeQuery.Account? = null,
  onProfileClick: () -> Unit = {}
) {
  RowLayout(
    leftComponent = {
      AppIcon()
    },
    rightComponent = {
      if (currentAccount != null) {
        Surface(shape = RoundedCornerShape(Theme.sizing.borderRadius.full)) {
          Button(onClick = onProfileClick) {
            AccountAvatar(
              url = currentAccount.ownerUserActor?.profilePhoto,
              size = Theme.sizing.icon.medium
            )
          }
        }
      } else {
        Surface(shape = RoundedCornerShape(Theme.sizing.borderRadius.full)) {
          Button(onClick = onProfileClick) {
            DayNighIcon(
              id = R.drawable.user_icon,
              contentDescription = "Expo Logo",
              modifier = Modifier
                .padding(Theme.spacing.tiny)
            )
          }
        }
      }
    }
  ) {
    Column {
      Heading(
        text = appName
      )

      Spacer(Theme.spacing.tiny)

      Text(
        text = "Development Build",
        fontSize = Theme.typography.small,
        color = Theme.colors.text.secondary
      )
    }
  }
}

@Composable
@Preview(showBackground = true, widthDp = 300)
fun AppHeaderPreview() {
  ScreenHeaderContainer {
    AppHeader(
      appName = "BareExpo"
    )
  }
}
