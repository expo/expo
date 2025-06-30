package expo.modules.devmenu.compose

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import com.composables.core.SheetDetent.Companion.Hidden
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.theme.Theme
import expo.modules.devmenu.compose.ui.AppInfo
import expo.modules.devmenu.compose.ui.BundlerInfo
import expo.modules.devmenu.compose.ui.BundlerInfoState
import expo.modules.devmenu.compose.ui.MenuButton
import expo.modules.devmenu.compose.ui.MenuContainer
import expo.modules.devmenu.compose.ui.MenuInfo
import expo.modules.devmenu.compose.ui.MenuSwitch
import expo.modules.devmenu.compose.ui.Warning

@Composable
fun DevMenuContent(
  appInfo: DevMenuState.AppInfo,
  onAction: DevMenuActionHandler = {}
) {
  Column {
    BundlerInfo(
      state = BundlerInfoState(
        bundlerIp = appInfo.hostUrl
      )
    )

    Column(modifier = Modifier.padding(Theme.spacing.small)) {
      Spacer(Modifier.size(Theme.spacing.small))

      MenuContainer {
        MenuButton(
          "Reload",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_refreshicon),
          onClick = { onAction(DevMenuAction.Reload) }
        )
        Divider()
        MenuButton(
          "Go home",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_homefilledinactiveicon),
          onClick = { onAction(DevMenuAction.GoHome) }
        )
      }

      Spacer(Modifier.size(Theme.spacing.small))

      MenuContainer {
        MenuButton(
          "Toggle performance monitor",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_performanceicon),
          onClick = { onAction(DevMenuAction.TogglePerformanceMonitor) }
        )
        Divider()
        MenuButton(
          "Toggle element inspector",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_inspectelementicon),
          onClick = { onAction(DevMenuAction.ToggleElementInspector) }
        )
        Divider()
        MenuButton(
          "Open JS debugger",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_debugicon),
          onClick = { onAction(DevMenuAction.OpenJSDebugger) }
        )
        Divider()
        MenuSwitch(
          "Fast Refresh",
          icon = painterResource(R.drawable._expodevclientcomponents_assets_runicon),
          onToggled = { newValue -> onAction(DevMenuAction.ToggleFastRefresh(newValue)) }
        )
      }

      Spacer(Modifier.size(Theme.spacing.large))

      Warning("Debugging not working? Try manually reloading first")

      Spacer(Modifier.size(Theme.spacing.large))

      MenuContainer {
        MenuInfo("Version", appInfo.appVersion ?: "N/A")
        Divider()
        MenuInfo("Runtime version", appInfo.runtimeVersion ?: "N/A")
        Divider()
        MenuButton("Tap to Copy All", icon = null, labelTextColor = Theme.colors.text.link)
      }

      Spacer(Modifier.size(Theme.spacing.large))

      MenuContainer {
        MenuButton(
          "Open React Native dev menu",
          icon = null,
          onClick = { onAction(DevMenuAction.OpenReactNativeDevMenu) }
        )
      }

      Spacer(Modifier.windowInsetsPadding(WindowInsets.navigationBars))
    }
  }
}

fun handleDevMenuAction(
  state: com.composables.core.ModalBottomSheetState,
  onAction: DevMenuActionHandler
): DevMenuActionHandler = customHandler@{ action ->
  val shouldClose = when (action) {
    DevMenuAction.Close -> false
    DevMenuAction.Open -> false
    DevMenuAction.GoHome -> true
    DevMenuAction.OpenJSDebugger -> true
    DevMenuAction.OpenReactNativeDevMenu -> true
    DevMenuAction.Reload -> true
    DevMenuAction.ToggleElementInspector -> true
    is DevMenuAction.ToggleFastRefresh -> true
    DevMenuAction.TogglePerformanceMonitor -> true
  }

  if (action == DevMenuAction.Close) {
    // If the action is to close the menu, we want to start the animation and then close the menu
    state.targetDetent = Hidden
    return@customHandler
  }

  onAction(action)
  if (shouldClose) {
    state.targetDetent = Hidden
  }
}

@Composable
fun DevMenuScreen(
  state: DevMenuState,
  onAction: (DevMenuAction) -> Unit = {}
) {
  val appInfo = state.appInfo ?: return

  val bottomSheetState = rememberBottomSheetState()

  val isOpen = state.isOpen

  LaunchedEffect(isOpen) {
    if (isOpen) {
      bottomSheetState.jumpTo(Peek)
    } else {
      bottomSheetState.targetDetent = Hidden
    }
  }

  val wrappedOnAction: DevMenuActionHandler = remember {
    handleDevMenuAction(bottomSheetState, onAction)
  }

  BottomSheet(
    state = bottomSheetState,
    onDismiss = {
      if (isOpen) {
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
      onAction = wrappedOnAction
    )
  }
}

@Composable
@Preview(showBackground = false)
fun DevMenuScreenRoot() {
  Box(Modifier.background(Theme.colors.background.secondary)) {
    DevMenuContent(
      appInfo = DevMenuState.AppInfo(
        appName = "Expo App",
        runtimeVersion = "1.0.0",
        hostUrl = "http://localhost:19006"
      )
    )
  }
}
