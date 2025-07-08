package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.Account
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.MenuButton

@Composable
fun AccountSelector(
  accounts: List<Account>,
  onClick: (Account) -> Unit = {},
  onSignOut: () -> Unit = {}
) {
  Column {
    RoundedSurface {
      Column {
        for ((index, account) in accounts.withIndex()) {
          MenuButton(
            label = account.name,
            enabled = !account.isSelected,
            onClick = {
              onClick(account)
            },
            rightIcon = if (!account.isSelected) {
              null
            } else {
              painterResource(R.drawable._expodevclientcomponents_assets_checkicon)
            }
          )
          if (index < accounts.size - 1) {
            Divider()
          }
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
