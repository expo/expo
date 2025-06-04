package expo.modules.devmenu.compose

import androidx.compose.runtime.mutableStateOf

class DevMenuViewModel(
  appInfo: DevMenuState.AppInfo,
) {
  private val _state = mutableStateOf(DevMenuState(
    appInfo = appInfo
  ))

  val state
    get() = _state.value

  fun onAction(action: DevMenuAction) {
    when (action) {
      DevMenuAction.Reload -> TODO()
      DevMenuAction.GoHome -> TODO()
      DevMenuAction.TogglePerformanceMonitor -> TODO()
      DevMenuAction.Close -> TODO()
      DevMenuAction.OpenJSDebugger -> TODO()
      DevMenuAction.OpenReactNativeDevMenu -> TODO()
      DevMenuAction.ToggleElementInspector -> TODO()
      is DevMenuAction.ToggleFastRefresh -> TODO()
    }
  }
}
