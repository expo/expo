package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import com.apollographql.apollo.api.label
import expo.modules.devlauncher.compose.ProfileState
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.MenuButton

@Composable
fun AccountSelector(
  accounts: List<ProfileState.Account>,
  onSignOut: () -> Unit = {}
) {
  Column {
    RoundedSurface {
      Column {
        for (account in accounts) {
          MenuButton(

            label = account.name
          )
        }
      }
    }

    Spacer(Theme.spacing.medium)

    ActionButton(
      "Log Out",
      style = Theme.colors.button.tertiary,
      onClick = onSignOut
    )
  }
}
