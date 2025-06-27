package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.ui.SectionHeader
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.MenuButton
import expo.modules.devmenu.compose.ui.MenuInfo
import expo.modules.devmenu.compose.ui.MenuSwitch

@Composable
fun SettingsScreen() {
  Column(modifier = Modifier.padding(Theme.spacing.medium)) {
    ScreenHeaderContainer(backgroundColor = Theme.colors.background.secondary) {
      Heading("Settings")
    }

    Spacer(Theme.spacing.large)

    RoundedSurface {
      MenuSwitch("Show menu as launch", icon = painterResource(R.drawable._expodevclientcomponents_assets_showmenuatlaunchicon))
    }

    Spacer(Theme.spacing.medium)

    SectionHeader(
      "Menu gestures"
    )

    Spacer(Theme.spacing.small)

    RoundedSurface {
      Column {
        MenuButton(
          "Shake device",
          icon = painterResource(expo.modules.devmenu.R.drawable._expodevclientcomponents_assets_shakedeviceicon),
          rightIcon = painterResource(R.drawable._expodevclientcomponents_assets_checkicon)
        )
        Divider()
        MenuButton(
          "Three three-finger long press",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_threefingerlongpressicon),
          rightIcon = painterResource(R.drawable._expodevclientcomponents_assets_checkicon)
        )
      }
    }

    Box(modifier = Modifier.padding(Theme.spacing.small)) {
      Text(
        "Selected gestures will toggle the developer menu while inside a preview. The menu allows you to reload or return to home and exposes developer tools.",
        fontSize = Theme.typography.small,
        color = Theme.colors.text.secondary
      )
    }

    Spacer(Theme.spacing.medium)

    RoundedSurface {
      Column {
        MenuInfo("Version", "N/A")
        Divider()
        MenuInfo("Runtime version", "N/A")
        Divider()
        MenuButton("Tap to Copy All", icon = null, labelTextColor = Theme.colors.text.link)
      }
    }
  }
}

@Composable
@Preview(showBackground = true)
fun SettingsScreenPreview() {
  SettingsScreen()
}
