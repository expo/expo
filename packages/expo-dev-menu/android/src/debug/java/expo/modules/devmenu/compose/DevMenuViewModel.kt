package expo.modules.devmenu.compose

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.facebook.react.ReactHost
import expo.modules.devmenu.DevMenuDevSettings
import expo.modules.devmenu.DevMenuPreferences
import expo.modules.devmenu.DevToolsSettings
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.kotlin.weak
import java.lang.ref.WeakReference

class DevMenuViewModel(
  val reactHostHolder: WeakReference<ReactHost>,
  val menuPreferences: DevMenuPreferences,
  val goHomeAction: (() -> Unit)? = null,
  val reloadAction: (() -> Unit)? = null
) : ViewModel() {
  private val reactHost
    get() = reactHostHolder.get()

  private val devToolsDelegate = run {
    val reactHost = reactHost ?: return@run null
    val devSupportManager = reactHost.devSupportManager ?: return@run null
    DevMenuDevToolsDelegate(devSupportManager.weak())
  }

  private val _state = mutableStateOf(
    DevMenuState(
      devToolsSettings = devSettings,
      showFab = menuPreferences.showFab,
      hasGoHomeAction = goHomeAction != null
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
      reactHost?.let {
        return DevMenuDevSettings.getDevSettings(it)
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

  fun updateCustomItems(items: List<DevMenuState.CustomItem>) {
    _state.value = _state.value.copy(customItems = items)
  }

  fun setInPictureInPictureMode(isInPictureInPictureMode: Boolean) {
    if (state.isInPictureInPictureMode == isInPictureInPictureMode) {
      return
    }
    _state.value = _state.value.copy(isInPictureInPictureMode = isInPictureInPictureMode)
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
      DevMenuAction.GoHome -> goHomeAction?.invoke()
      DevMenuAction.TogglePerformanceMonitor -> devToolsDelegate?.togglePerformanceMonitor()
      DevMenuAction.OpenJSDebugger -> devToolsDelegate?.openJSInspector()
      DevMenuAction.OpenReactNativeDevMenu -> reactHost?.devSupportManager?.showDevOptionsDialog()
      DevMenuAction.ToggleElementInspector -> devToolsDelegate?.toggleElementInspector()
      is DevMenuAction.ToggleFastRefresh -> toggleFastRefresh()
      is DevMenuAction.ToggleFab -> toggleFab()
      DevMenuAction.FinishOnboarding -> finishOnboarding()
      is DevMenuAction.TriggerCustomCallback -> action.item.fn.invoke()
    }
  }

  class Factory(
    private val reactHostHolder: WeakReference<ReactHost>,
    private val menuPreferences: DevMenuPreferences,
    private val goHomeAction: (() -> Unit)?,
    private val reloadAction: (() -> Unit)?
  ) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
      @Suppress("UNCHECKED_CAST")
      return DevMenuViewModel(
        reactHostHolder,
        menuPreferences,
        goHomeAction,
        reloadAction
      ) as T
    }
  }
}
