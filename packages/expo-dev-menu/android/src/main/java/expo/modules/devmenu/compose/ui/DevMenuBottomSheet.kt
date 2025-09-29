package expo.modules.devmenu.compose.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import com.composables.core.SheetDetent.Companion.Hidden
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuActionHandler
import expo.modules.devmenu.compose.DevMenuState

@Composable
fun DevMenuBottomSheet(
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

  BottomSheetScaffold(
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
    DevMenuScreen(
      appInfo = appInfo,
      devToolsSettings = state.devToolsSettings,
      customItems = state.customItems,
      shouldShowOnboarding = shouldShowOnboarding.value,
      showFab = state.showFab,
      onAction = wrappedOnAction
    )
  }
}
