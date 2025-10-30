package expo.modules.devmenu.compose

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.facebook.react.ReactHost
import expo.modules.devmenu.DevMenuDevSettings
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.DevMenuManager.getReactHost
import expo.modules.devmenu.DevMenuPreferencesHandle
import expo.modules.devmenu.DevToolsSettings
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class DevMenuViewModel(
  val reactHostHolder: WeakReference<ReactHost>
) : ViewModel() {
  private val menuPreferences = DevMenuPreferencesHandle
  private val devToolsDelegate = run {
    val reactHost = getReactHost() ?: return@run null
    val devSupportManager = reactHost.devSupportManager ?: return@run null

    DevMenuDevToolsDelegate(devSupportManager.weak())
  }

  private val _state = mutableStateOf(
    DevMenuState(
      devToolsSettings = devSettings,
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

  val devSettings: DevToolsSettings
    get() {
      val reactHost = reactHostHolder.get()
      if (reactHost != null) {
        return DevMenuDevSettings.getDevSettings(reactHost)
      }

      return DevToolsSettings()
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
      isOnboardingFinished = menuPreferences.isOnboardingFinished
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
      devToolsSettings = devSettings
    )
  }

  private fun toggleMenu() {
    _state.value = _state.value.copy(isOpen = !state.isOpen)
  }

  private fun toggleFastRefresh() {
    devToolsDelegate?.toggleFastRefresh()
    _state.value = _state.value.copy(devToolsSettings = devSettings)
  }

  private fun finishOnboarding() {
    menuPreferences.isOnboardingFinished = true
    _state.value = _state.value.copy(isOnboardingFinished = true)
  }

  private fun toggleFab() {
    menuPreferences.showFab = !menuPreferences.showFab
  }

  fun onAction(action: DevMenuAction) {
    when (action) {
      DevMenuAction.Open -> openMenu()
      DevMenuAction.Close -> closeMenu()
      DevMenuAction.Toggle -> toggleMenu()
      DevMenuAction.Reload -> devToolsDelegate?.reload()
      DevMenuAction.GoHome -> DevMenuManager.goToHome()
      DevMenuAction.TogglePerformanceMonitor -> devToolsDelegate?.togglePerformanceMonitor()
      DevMenuAction.OpenJSDebugger -> devToolsDelegate?.openJSInspector()
      DevMenuAction.OpenReactNativeDevMenu -> getReactHost()?.devSupportManager?.showDevOptionsDialog()
      DevMenuAction.ToggleElementInspector -> devToolsDelegate?.toggleElementInspector()
      is DevMenuAction.ToggleFastRefresh -> toggleFastRefresh()
      is DevMenuAction.ToggleFab -> toggleFab()
      DevMenuAction.FinishOnboarding -> finishOnboarding()
      is DevMenuAction.TriggerCustomCallback -> DevMenuManager.sendEventToDelegateBridge("registeredCallbackFired", action.name)
    }
  }

  class Factory(private val reactHostHolder: WeakReference<ReactHost>) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
      @Suppress("UNCHECKED_CAST")
      return DevMenuViewModel(reactHostHolder) as T
    }
  }

  companion object {
    private fun mapCallbacks(callbacks: List<DevMenuManager.Callback>) =
      callbacks.map { DevMenuState.CustomItem(name = it.name, shouldCollapse = it.shouldCollapse) }
  }
}
