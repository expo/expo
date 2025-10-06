package expo.modules.devmenu.compose

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.DevMenuPreferencesHandle

class DevMenuViewModel : ViewModel() {
  private val menuPreferences = DevMenuPreferencesHandle
  private val _state = mutableStateOf(
    DevMenuState(
      devToolsSettings = DevMenuManager.getDevSettings(),
      customItems = mapCallbacks(DevMenuManager.registeredCallbacks)
    )
  )

  val state
    get() = _state.value

  private val listener = {
    _state.value = state.copy(
      showFab = menuPreferences.showFab
    )
  }

  init {
    menuPreferences.addOnChangeListener(listener)
  }

  override fun onCleared() {
    super.onCleared()
    menuPreferences.removeOnChangeListener(listener)
  }

  fun updateAppInfo(appInfo: DevMenuState.AppInfo) {
    _state.value = _state.value.copy(
      appInfo = appInfo,
      isOnboardingFinished = DevMenuManager.getSettings()?.isOnboardingFinished ?: true
    )
  }

  fun updateCustomItems(callbacks: List<DevMenuManager.Callback>) {
    _state.value = _state.value.copy(customItems = mapCallbacks(callbacks))
  }

  private fun closeMenu() {
    _state.value = _state.value.copy(isOpen = false)
  }

  private fun openMenu() {
    _state.value = _state.value.copy(
      isOpen = true,
      // Refresh dev tools settings when opening the menu
      devToolsSettings = DevMenuManager.getDevSettings()
    )
  }

  fun onAction(action: DevMenuAction) = with(DevMenuManager) {
    when (action) {
      DevMenuAction.Open -> this@DevMenuViewModel.openMenu()
      DevMenuAction.Close -> this@DevMenuViewModel.closeMenu()
      DevMenuAction.Reload -> reload()
      DevMenuAction.GoHome -> goToHome()
      DevMenuAction.TogglePerformanceMonitor -> togglePerformanceMonitor()
      DevMenuAction.OpenJSDebugger -> openJSInspector()
      DevMenuAction.OpenReactNativeDevMenu -> getReactHost()?.devSupportManager?.showDevOptionsDialog()
      DevMenuAction.ToggleElementInspector -> toggleInspector()
      is DevMenuAction.ToggleFastRefresh -> {
        toggleFastRefresh()
        _state.value = _state.value.copy(devToolsSettings = DevMenuManager.getDevSettings())
      }
      is DevMenuAction.ToggleFab -> toggleFab()
      DevMenuAction.FinishOnboarding -> {
        DevMenuManager.getSettings()?.isOnboardingFinished = true
        _state.value = _state.value.copy(isOnboardingFinished = true)
      }
      is DevMenuAction.TriggerCustomCallback -> {
        sendEventToDelegateBridge("registeredCallbackFired", action.name)
      }
    }
  }

  companion object {
    private fun mapCallbacks(callbacks: List<DevMenuManager.Callback>) =
      callbacks.map { DevMenuState.CustomItem(name = it.name, shouldCollapse = it.shouldCollapse) }
  }
}
