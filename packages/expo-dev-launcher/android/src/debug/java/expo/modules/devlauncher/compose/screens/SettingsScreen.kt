package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.SettingsAction
import expo.modules.devlauncher.compose.models.SettingsState
import expo.modules.devlauncher.compose.ui.LauncherIcons
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.ToggleSwitch
import expo.modules.devmenu.compose.ui.MenuIcons
import expo.modules.devmenu.compose.ui.NewMenuButton
import expo.modules.devmenu.compose.ui.Section
import expo.modules.devmenu.compose.ui.SystemSection

@Composable
fun SettingsScreen(
  state: SettingsState = SettingsState(),
  onAction: (SettingsAction) -> Unit = {}
) {
  val scrollState = rememberScrollState()
  Column(
    modifier = Modifier
      .verticalScroll(scrollState)
      .statusBarsPadding()
      .padding(horizontal = NewAppTheme.spacing.`4`)
  ) {
    Column(
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
      modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = NewAppTheme.spacing.`6`)
    ) {
      LauncherIcons.Settings(
        size = 48.dp,
        tint = NewAppTheme.colors.icon.quaternary
      )

      NewText(
        "Settings",
        style = NewAppTheme.font.xxl.merge(
          fontWeight = FontWeight.Bold
        )
      )
    }

    NewMenuButton(
      icon = {
        LauncherIcons.ShowAtLaunch(
          size = 20.dp,
          tint = NewAppTheme.colors.icon.tertiary
        )
      },
      content = {
        NewText(
          text = "Show menu at launch"
        )
      },
      rightComponent = {
        ToggleSwitch(
          isToggled = state.showMenuAtLaunch
        )
      },
      onClick = { onAction(SettingsAction.ToggleShowMenuAtLaunch(!state.showMenuAtLaunch)) }
    )

    Spacer(NewAppTheme.spacing.`6`)

    MenuGesturesSection(state, onAction)

    Spacer(NewAppTheme.spacing.`3`)

    NewText(
      "Selected gestures will toggle the developer menu while inside a preview. The menu allows you to reload or return to home and exposes developer tools.",
      style = NewAppTheme.font.md.merge(
        lineHeight = 21.sp
      ),
      color = NewAppTheme.colors.text.quaternary
    )

    Spacer(NewAppTheme.spacing.`6`)

    val info = state.applicationInfo
    SystemSection(
      appVersion = info?.appVersion,
      runtimeVersion = (info as? ApplicationInfo.Updates)?.runtimeVersion,
      fullDataProvider = { info?.toJson() ?: "No application info available" }
    )
  }
}

@Composable
private fun MenuGesturesSection(state: SettingsState, onAction: (SettingsAction) -> Unit) {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`)
  ) {
    Section.Header("MENU GESTURES")

    RoundedSurface {
      Column {
        NewMenuButton(
          withSurface = false,
          icon = {
            MenuIcons.Performance(
              size = 20.dp,
              tint = NewAppTheme.colors.icon.tertiary
            )
          },
          content = {
            NewText(
              text = "Shake device"
            )
          },
          rightComponent = {
            ToggleSwitch(
              isToggled = state.isShakeEnable
            )
          },
          onClick = { onAction(SettingsAction.ToggleShakeEnable(!state.isShakeEnable)) }
        )

        Divider(
          thickness = 0.5.dp,
          color = NewAppTheme.colors.border.default
        )

        NewMenuButton(
          withSurface = false,
          icon = {
            MenuIcons.Inspect(
              size = 20.dp,
              tint = NewAppTheme.colors.icon.tertiary
            )
          },
          content = {
            NewText(
              text = "3 fingers long press"
            )
          },
          rightComponent = {
            ToggleSwitch(
              isToggled = state.isThreeFingerLongPressEnable
            )
          },
          onClick = { onAction(SettingsAction.ToggleThreeFingerLongPressEnable(!state.isThreeFingerLongPressEnable)) }
        )

        Divider(
          thickness = 0.5.dp,
          color = NewAppTheme.colors.border.default
        )

        NewMenuButton(
          withSurface = false,
          icon = {
            MenuIcons.Fab(
              size = 20.dp,
              tint = NewAppTheme.colors.icon.tertiary
            )
          },
          content = {
            NewText(
              text = "Action button"
            )
          },
          rightComponent = {
            ToggleSwitch(
              isToggled = state.showFabAtLaunch
            )
          },
          onClick = { onAction(SettingsAction.ToggleShowFabAtLaunch(!state.showFabAtLaunch)) }
        )
      }
    }
  }
}

@Composable
@Preview(showBackground = true)
fun SettingsScreenPreview() {
  DefaultScreenContainer {
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
}
