package expo.modules.devmenu.compose

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import expo.modules.devmenu.DevMenuManager

class DevMenuViewModel : ViewModel() {
  private val _state = mutableStateOf<DevMenuState>(DevMenuState())

  val state
    get() = _state.value

  fun updateAppInfo(appInfo: DevMenuState.AppInfo) {
    _state.value = _state.value.copy(appInfo = appInfo)
  }

  private fun closeMenu() {
    _state.value = _state.value.copy(isOpen = false)
  }

  private fun openMenu() {
    _state.value = _state.value.copy(isOpen = true)
  }

  fun onAction(action: DevMenuAction) = with(DevMenuManager) {
    when (action) {
      DevMenuAction.Open -> this@DevMenuViewModel.openMenu()
      DevMenuAction.Close -> this@DevMenuViewModel.closeMenu()
      DevMenuAction.Reload -> reload()
      DevMenuAction.GoHome -> goToHome()
      DevMenuAction.TogglePerformanceMonitor -> togglePerformanceMonitor()
      DevMenuAction.OpenJSDebugger -> openJSInspector()
      DevMenuAction.OpenReactNativeDevMenu -> {
      }
      DevMenuAction.ToggleElementInspector -> toggleInspector()
      is DevMenuAction.ToggleFastRefresh -> toggleFastRefresh()
    }
  }
}
