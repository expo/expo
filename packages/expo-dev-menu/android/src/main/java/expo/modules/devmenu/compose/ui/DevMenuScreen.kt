package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.DevToolsSettings
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.DevMenuState
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun DevMenuScreen(
  appInfo: DevMenuState.AppInfo,
  devToolsSettings: DevToolsSettings,
  customItems: List<DevMenuState.CustomItem> = emptyList(),
  shouldShowOnboarding: Boolean = false,
  showFab: Boolean = false,
  onAction: DevMenuActionHandler = {}
) {
  if (shouldShowOnboarding) {
    Onboarding(
      onOnboardingFinished = {
        onAction(DevMenuAction.FinishOnboarding)
      }
    )
    return
  }

  Column {
    BundlerInfo(bundlerIp = appInfo.hostUrl)

    Spacer(NewAppTheme.spacing.`2`)

    Row(
      horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
      verticalAlignment = Alignment.CenterVertically
    ) {
      QuickAction(
        label = "Reload",
        icon = { MenuIcons.Reload(size = 20.dp, tint = NewAppTheme.colors.icon.default) },
        modifier = Modifier.weight(1f),
        onClick = { onAction(DevMenuAction.Reload) }
      )

      QuickAction(
        label = "Go home",
        icon = { MenuIcons.Home(size = 20.dp, tint = NewAppTheme.colors.icon.default) },
        modifier = Modifier.weight(1f),
        onClick = { onAction(DevMenuAction.GoHome) }
      )
    }

    Spacer(NewAppTheme.spacing.`5`)

    if (customItems.isNotEmpty()) {
      CustomItemsSection(
        items = customItems,
        onItemClick = { item ->
          onAction(DevMenuAction.TriggerCustomCallback(item.name, item.shouldCollapse))
        }
      )

      Spacer(NewAppTheme.spacing.`5`)
    }

    ToolsSection(onAction, devToolsSettings, showFab)

    Box(modifier = Modifier.padding(vertical = NewAppTheme.spacing.`6`)) {
      Warning("Debugging not working? Try manually reloading first")
    }

    SystemSection(
      appInfo.appVersion,
      appInfo.runtimeVersion,
      fullDataProvider = { appInfo.toJson() }
    )
  }
}

@Composable
@Preview(showBackground = false)
fun DevMenuScreenPreview() {
  Box(
    Modifier.Companion
      .background(NewAppTheme.colors.background.default)
      .padding(horizontal = NewAppTheme.spacing.`4`)
  ) {
    DevMenuScreen(
      appInfo = DevMenuState.AppInfo(
        appName = "Expo App",
        runtimeVersion = "1.0.0",
        hostUrl = "http://localhost:19006"
      ),
      devToolsSettings = DevToolsSettings()
    )
  }
}
