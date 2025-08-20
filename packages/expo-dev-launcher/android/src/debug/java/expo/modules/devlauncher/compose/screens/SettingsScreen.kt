package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.composeunstyled.Button
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.SettingsAction
import expo.modules.devlauncher.compose.models.SettingsState
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.ToggleSwitch
import expo.modules.devmenu.compose.ui.NewMenuButton
import expo.modules.devmenu.compose.utils.copyToClipboard

@Composable
fun SettingsScreen(
  state: SettingsState = SettingsState(),
  onAction: (SettingsAction) -> Unit = {}
) {
  val context = LocalContext.current

  Column(
    modifier = Modifier
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
      Icon(
        painterResource(R.drawable.settings),
        contentDescription = "Settings icon",
        modifier = Modifier.size(48.dp)
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
        Icon(
          painter = painterResource(R.drawable.show_at_launch),
          contentDescription = "Show at launch icon",
          tint = NewAppTheme.colors.icon.tertiary,
          modifier = Modifier.size(20.dp)
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

    NewText(
      "MENU GESTURES",
      style = NewAppTheme.font.sm.merge(
        fontWeight = FontWeight.Medium,
        fontFamily = NewAppTheme.font.mono
      ),
      color = NewAppTheme.colors.text.quaternary
    )

    Spacer(NewAppTheme.spacing.`3`)

    RoundedSurface {
      Column {
        NewMenuButton(
          withSurface = false,
          icon = {
            Icon(
              painter = painterResource(R.drawable.pulse),
              contentDescription = "Shake device icon",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
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
            Icon(
              painter = painterResource(R.drawable.inspect),
              contentDescription = "3 fingers long press icon",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
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
            Icon(
              painter = painterResource(R.drawable.dev_menu_fab_icon),
              contentDescription = "Action button icon",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
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

    Spacer(NewAppTheme.spacing.`3`)

    NewText(
      "Selected gestures will toggle the developer menu while inside a preview. The menu allows you to reload or return to home and exposes developer tools.",
      style = NewAppTheme.font.md.merge(
        lineHeight = 21.sp
      ),
      color = NewAppTheme.colors.text.quaternary
    )

    Spacer(NewAppTheme.spacing.`6`)

    NewText(
      "SYSTEM",
      style = TextStyle(
        fontSize = NewAppTheme.font.sm.fontSize,
        fontFamily = NewAppTheme.font.mono,
        fontWeight = FontWeight.Medium,
        color = NewAppTheme.colors.text.quaternary
      )
    )

    Spacer(NewAppTheme.spacing.`3`)

    Divider(
      thickness = 0.5.dp,
      color = NewAppTheme.colors.border.default
    )

    Row(
      horizontalArrangement = Arrangement.SpaceBetween,
      modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 12.dp)
    ) {
      NewText(
        "Version",
        color = NewAppTheme.colors.text.secondary
      )

      NewText(
        state.applicationInfo?.appVersion ?: "N/A",
        color = NewAppTheme.colors.text.secondary
      )
    }

    Divider(
      thickness = 0.5.dp,
      color = NewAppTheme.colors.border.default
    )

    Row(
      horizontalArrangement = Arrangement.SpaceBetween,
      modifier = Modifier
        .fillMaxWidth()
        .padding(vertical = 12.dp)
    ) {
      NewText(
        "Runtime version",
        color = NewAppTheme.colors.text.secondary
      )

      val runtimeVersion = (state.applicationInfo as? ApplicationInfo.Updates)?.runtimeVersion
      NewText(
        runtimeVersion ?: "N/A",
        color = NewAppTheme.colors.text.secondary
      )
    }

    Divider(
      thickness = 0.5.dp,
      color = NewAppTheme.colors.border.default
    )

    Button(onClick = {
      copyToClipboard(
        context,
        label = "Copy system info",
        text = state.applicationInfo?.toJson() ?: "No application info available"
      )
    }) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        modifier = Modifier
          .fillMaxWidth()
          .padding(vertical = 12.dp)
      ) {
        NewText(
          "Copy system info",
          color = NewAppTheme.colors.text.link,
          style = NewAppTheme.font.sm
        )
        Icon(
          painter = painterResource(expo.modules.devmenu.R.drawable.copy),
          contentDescription = "Copy system info",
          tint = NewAppTheme.colors.text.link,
          modifier = Modifier
            .size(12.dp)
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
