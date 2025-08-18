package expo.modules.devmenu.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.SheetDetent.Companion.Hidden
import com.composeunstyled.Button
import com.composeunstyled.Icon
import expo.modules.devmenu.DevMenuPreferencesHandle
import expo.modules.devmenu.DevToolsSettings
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.AppInfo
import expo.modules.devmenu.compose.ui.BundlerInfo
import expo.modules.devmenu.compose.ui.NewMenuButton
import expo.modules.devmenu.compose.ui.Onboarding
import expo.modules.devmenu.compose.ui.Warning
import expo.modules.devmenu.compose.utils.copyToClipboard

@Composable
fun DevMenuContent(
  appInfo: DevMenuState.AppInfo,
  devToolsSettings: DevToolsSettings,
  shouldShowOnboarding: Boolean = false,
  onAction: DevMenuActionHandler = {}
) {
  if (shouldShowOnboarding) {
    Onboarding {
      onAction(DevMenuAction.FinishOnboarding)
    }
    return
  }

  Column {
    BundlerInfo(
      bundlerIp = appInfo.hostUrl
    )

    Spacer(NewAppTheme.spacing.`2`)

    Row(
      horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
      verticalAlignment = Alignment.CenterVertically
    ) {
      val quickAction = @Composable { icon: Painter, text: String, action: () -> Unit ->
        NewMenuButton(
          modifier = Modifier.weight(1f),
          icon = {
            Icon(
              painter = icon,
              contentDescription = text,
              tint = NewAppTheme.colors.icon.default,
              modifier = Modifier.size(20.dp)
            )
          },
          content = {
            NewText(
              text = text,
              style = NewAppTheme.font.md.merge(fontWeight = FontWeight.Medium)
            )
          },
          onClick = action
        )
      }

      quickAction(
        painterResource(R.drawable.refresh),
        "Reload"
      ) { onAction(DevMenuAction.Reload) }

      quickAction(
        painterResource(R.drawable.home),
        "Go home"
      ) { onAction(DevMenuAction.GoHome) }
    }

    Spacer(NewAppTheme.spacing.`5`)

    NewText(
      "TOOLS",
      style = TextStyle(
        fontSize = NewAppTheme.font.sm.fontSize,
        fontFamily = NewAppTheme.font.mono,
        fontWeight = FontWeight.Medium,
        color = NewAppTheme.colors.text.quaternary
      )
    )

    Spacer(NewAppTheme.spacing.`3`)

    RoundedSurface {
      Column {
        NewMenuButton(
          withSurface = false,
          icon = {
            Icon(
              painter = painterResource(R.drawable.performance),
              contentDescription = "Reload",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
            )
          },
          content = {
            NewText(
              text = "Performance monitor"
            )
          },
          onClick = {
            onAction(DevMenuAction.Reload)
          }
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
              contentDescription = "Element inspector",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
            )
          },
          content = {
            NewText(
              text = "Element inspector"
            )
          },
          onClick = {
            onAction(DevMenuAction.ToggleElementInspector)
          }
        )

        Divider(
          thickness = 0.5.dp,
          color = NewAppTheme.colors.border.default
        )

        NewMenuButton(
          withSurface = false,
          icon = {
            Icon(
              painter = painterResource(R.drawable.bug),
              contentDescription = "JS debugger",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
            )
          },
          content = {
            NewText(
              text = "JS debugger"
            )
          },
          onClick = {
            onAction(DevMenuAction.OpenJSDebugger)
          }
        )

        Divider(
          thickness = 0.5.dp,
          color = NewAppTheme.colors.border.default
        )

        NewMenuButton(
          withSurface = false,
          icon = {
            Icon(
              painter = painterResource(R.drawable.frame),
              contentDescription = "Fast Refresh",
              tint = NewAppTheme.colors.icon.tertiary,
              modifier = Modifier.size(20.dp)
            )
          },
          content = {
            NewText(
              text = "Fast Refresh"
            )
          },
          rightComponent = {
            expo.modules.devmenu.compose.primitives.ToggleSwitch(
              isToggled = devToolsSettings.isHotLoadingEnabled
            )
          },
          onClick = {
            onAction(DevMenuAction.ToggleFastRefresh(!devToolsSettings.isHotLoadingEnabled))
          }
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
              contentDescription = "Action button",
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
            expo.modules.devmenu.compose.primitives.ToggleSwitch(
              isToggled = DevMenuPreferencesHandle.showFab
            )
          },
          onClick = {
            onAction(DevMenuAction.ToggleFab)
          }
        )
      }
    }

    Box(modifier = Modifier.padding(vertical = NewAppTheme.spacing.`6`)) {
      Warning("Debugging not working? Try manually reloading first")
    }

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
        appInfo.appVersion ?: "N/A",
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
      NewText(
        appInfo.runtimeVersion ?: "N/A",
        color = NewAppTheme.colors.text.secondary
      )
    }

    Divider(
      thickness = 0.5.dp,
      color = NewAppTheme.colors.border.default
    )

    val context = LocalContext.current
    Button(onClick = {
      copyToClipboard(
        context,
        label = "Application Info",
        text = appInfo.toJson()
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
          painter = painterResource(R.drawable.copy),
          contentDescription = "Copy system info",
          tint = NewAppTheme.colors.text.link,
          modifier = Modifier
            .size(12.dp)
        )
      }
    }

    Spacer(modifier = Modifier.windowInsetsPadding(WindowInsets.navigationBars))
  }
}

@Composable
fun DevMenuScreen(
  state: DevMenuState,
  onAction: DevMenuActionHandler = {}
) {
  val appInfo = state.appInfo ?: return
  val isOpen = state.isOpen
  val shouldShowOnboarding = remember(state.isOnboardingFinished) {
    mutableStateOf(!state.isOnboardingFinished)
  }
  val bottomSheetState = rememberBottomSheetState()

  LaunchedEffect(isOpen) {
    if (isOpen) {
      bottomSheetState.targetDetent = Peek
    } else {
      if (bottomSheetState.currentDetent != Hidden) {
        bottomSheetState.animateTo(Hidden)
        shouldShowOnboarding.value = false
      }
    }
  }

  val wrappedOnAction: DevMenuActionHandler = remember {
    ActionHandler@{ action: DevMenuAction ->
      val shouldClose = action.shouldCloseMenu

      if (action == DevMenuAction.Close) {
        // If the action is to close the menu, we want to start the animation and then close the menu
        bottomSheetState.targetDetent = Hidden
        return@ActionHandler
      }

      onAction(action)
      if (shouldClose) {
        bottomSheetState.targetDetent = Hidden
      }
    }
  }

  BottomSheet(
    state = bottomSheetState,
    onDismiss = {
      if (isOpen) {
        shouldShowOnboarding.value = false
        // If the menu is open, we want to close it
        // and not just hide the bottom sheet.
        onAction(DevMenuAction.Close)
      }
    },
    header = {
      AppInfo(
        appName = appInfo.appName,
        runtimeVersion = appInfo.runtimeVersion,
        sdkVersion = appInfo.sdkVersion,
        onAction = wrappedOnAction
      )
    }
  ) {
    DevMenuContent(
      appInfo = appInfo,
      devToolsSettings = state.devToolsSettings,
      shouldShowOnboarding = shouldShowOnboarding.value,
      onAction = wrappedOnAction
    )
  }
}

@Composable
@Preview(showBackground = false)
fun DevMenuScreenRoot() {
  Box(
    Modifier
      .background(Theme.colors.background.default)
      .padding(horizontal = NewAppTheme.spacing.`4`)
  ) {
    DevMenuContent(
      appInfo = DevMenuState.AppInfo(
        appName = "Expo App",
        runtimeVersion = "1.0.0",
        hostUrl = "http://localhost:19006"
      ),
      devToolsSettings = DevToolsSettings()
    )
  }
}
