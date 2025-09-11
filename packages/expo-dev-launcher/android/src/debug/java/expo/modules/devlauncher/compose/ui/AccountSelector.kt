package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import expo.modules.devlauncher.compose.models.Account
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.ui.NewMenuButton

@Composable
fun AccountSelector(
  accounts: List<Account>,
  onClick: (Account) -> Unit = {},
  onSignOut: () -> Unit = {}
) {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`4`)
  ) {
    NewText(
      "Account",
      style = NewAppTheme.font.xxl.merge(
        fontWeight = FontWeight.SemiBold,
        lineHeight = 20.sp,
        textAlign = TextAlign.Center
      ),
      modifier = Modifier.fillMaxWidth()
    )

    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
    ) {
      for (account in accounts) {
        NewMenuButton(
          spacedBy = NewAppTheme.spacing.`3`,
          icon = {
            AccountAvatar(
              account.avatar,
              size = 32.dp
            )
          },
          content = {
            NewText(
              text = account.name,
              style = NewAppTheme.font.lg.merge(
                fontWeight = FontWeight.SemiBold
              )
            )
          },
          rightComponent = {
            if (account.isSelected) {
              LauncherIcons.CheckCircle(
                size = 20.dp,
                tint = Color(0xFF34C759)
              )
            }
          },
          onClick = {
            onClick(account)
          },
          enabled = !account.isSelected
        )
      }
    }

    ActionButton(
      "Log Out",
      foreground = Color.White,
      background = Color.Black,
      modifier = Modifier.padding(NewAppTheme.spacing.`3`),
      onClick = onSignOut
    )
  }
}
