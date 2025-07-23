package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.models.SettingsAction
import expo.modules.devlauncher.compose.models.SettingsState
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.ui.SectionHeader
import expo.modules.devmenu.compose.utils.copyToClipboard
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devmenu.compose.primitives.DayNighIcon
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
fun SettingsScreen(
  state: SettingsState = SettingsState(),
  onAction: (SettingsAction) -> Unit = {}
) {
  val context = LocalContext.current

  Column(modifier = Modifier.padding(Theme.spacing.medium)) {
    ScreenHeaderContainer(backgroundColor = Theme.colors.background.secondary) {
      Heading("Settings")
    }

    Spacer(Theme.spacing.large)

    RoundedSurface {
      MenuSwitch(
        "Show menu as launch",
        icon = painterResource(R.drawable.show_menu_at_launch_icon),
        toggled = state.showMenuAtLaunch,
        onToggled = { onAction(SettingsAction.ToggleShowMenuAtLaunch(it)) }
      )
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
          leftComponent = @Composable {
            // This icon has two different versions file version, one for light and one for dark mode.
            // That's why we use Image instead of DayNighIcon.
            Image(
              painter = painterResource(R.drawable.shake_device_icon),
              contentDescription = "Shake device to open menu icon"
            )
          },
          onClick = {
            onAction(SettingsAction.ToggleShakeEnable(!state.isShakeEnable))
          },
          rightComponent = @Composable {
            if (state.isShakeEnable) {
              DayNighIcon(
                id = R.drawable.check_icon,
                contentDescription = "Shake enabled icon"
              )
            } else {
              null
            }
          }
        )
        Divider()
        MenuButton(
          "Three three-finger long press",
          leftIcon = painterResource(R.drawable.three_finger_long_press_icon),
          onClick = {
            onAction(SettingsAction.ToggleThreeFingerLongPressEnable(!state.isThreeFingerLongPressEnable))
          },
          rightIcon = if (state.isThreeFingerLongPressEnable) {
            painterResource(R.drawable.check_icon)
          } else {
            null
          }
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
        MenuInfo("Version", state.applicationInfo?.appVersion ?: "N/A")
        Divider()
        val runtimeVersion = (state.applicationInfo as? ApplicationInfo.Updates)?.runtimeVersion
        if (runtimeVersion != null) {
          MenuInfo("Runtime version", runtimeVersion)
          Divider()
        }

        MenuButton(
          "Tap to Copy All",
          onClick = {
            copyToClipboard(
              context,
              label = "Application Info",
              text = state.applicationInfo?.toJson() ?: "No application info available"
            )
          },
          leftIcon = null,
          labelTextColor = Theme.colors.text.link
        )
      }
    }
  }
}

@Composable
@Preview(showBackground = true)
fun SettingsScreenPreview() {
  SettingsScreen(
    state = SettingsState(
      applicationInfo = ApplicationInfo.Updates(
        appName = "BareExpo",
        appVersion = "1.0.0",
        appId = "01980973-2cf9-71fb-a891-a53444132a6e",
        runtimeVersion = "1.0.0",
        projectUrl = "https://u.expo.dev/01980973-2cf9-71fb-a891-a53444132a6e"
      )
    )
  )
}
