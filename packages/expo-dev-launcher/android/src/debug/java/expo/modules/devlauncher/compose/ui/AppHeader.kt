package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composables.core.Icon
import expo.modules.devlauncher.MeQuery
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.primitives.AppIcon
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Surface
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

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
        AccountAvatar(
          url = currentAccount.ownerUserActor?.profilePhoto,
          size = Theme.sizing.icon.medium,
          modifier = Modifier.clickable(onClick = onProfileClick)
        )
      } else {
        Surface(shape = RoundedCornerShape(Theme.sizing.borderRadius.full), modifier = Modifier.clickable(onClick = onProfileClick)) {
          Icon(
            painter = painterResource(R.drawable._expodevclientcomponents_assets_usericonlight),
            contentDescription = "Expo Logo",
            tint = Theme.colors.icon.default,
            modifier = Modifier.padding(Theme.spacing.tiny)
          )
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
