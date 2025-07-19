package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import com.composables.core.Icon
import com.composeunstyled.Button
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.models.Account
import expo.modules.devlauncher.compose.utils.withIsLast
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun AccountSelector(
  accounts: List<Account>,
  onClick: (Account) -> Unit = {},
  onSignOut: () -> Unit = {}
) {
  Column {
    RoundedSurface {
      Column {
        for ((account, isLast) in accounts.withIsLast()) {
          Button(
            onClick = { onClick(account) },
            enabled = !account.isSelected
          ) {
            val avatar = @Composable {
              RoundedSurface(borderRadius = Theme.sizing.borderRadius.full) {
                AccountAvatar(
                  account.avatar
                )
              }
            }
            RowLayout(
              modifier = Modifier.padding(Theme.spacing.small),
              leftComponent = avatar,
              rightComponent = {
                if (account.isSelected) {
                  Icon(
                    painterResource(R.drawable._expodevclientcomponents_assets_checkicon),
                    contentDescription = "Checked"
                  )
                }
              }
            ) {
              Text(account.name)
            }
          }

          if (!isLast) {
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
