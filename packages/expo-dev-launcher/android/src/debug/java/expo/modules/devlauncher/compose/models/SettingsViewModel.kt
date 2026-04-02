package expo.modules.devlauncher.compose.models

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devlauncher.services.NsdPreferences
import expo.modules.devlauncher.services.inject
import expo.modules.devmenu.DevMenuPreferences

data class SettingsState(
  val showMenuAtLaunch: Boolean = false,
  val isShakeEnable: Boolean = true,
  val isThreeFingerLongPressEnable: Boolean = true,
  val isKeyCommandEnabled: Boolean = true,
  val applicationInfo: ApplicationInfo? = null,
  // TODO @behenate - make true the default for VR
  val showFabAtLaunch: Boolean = false,
  val filterByPackageName: Boolean = false,
  val filterBySlug: String = "",
  val filterByUsername: Boolean = false
)

sealed interface SettingsAction {
  data class ToggleShowMenuAtLaunch(val newValue: Boolean) : SettingsAction
  data class ToggleShakeEnable(val newValue: Boolean) : SettingsAction
  data class ToggleThreeFingerLongPressEnable(val newValue: Boolean) : SettingsAction
  data class ToggleKeyCommandEnable(val newValue: Boolean) : SettingsAction
  data class ToggleShowFabAtLaunch(val newValue: Boolean) : SettingsAction
  data class ToggleFilterByPackageName(val newValue: Boolean) : SettingsAction
  data class UpdateFilterBySlug(val newValue: String) : SettingsAction
  data class ToggleFilterByUsername(val newValue: Boolean) : SettingsAction
}

class SettingsViewModel : ViewModel() {
  private val menuPreferences = inject<DevMenuPreferences>()
  private val nsdPreferences = inject<NsdPreferences>()
  private val appService = inject<AppService>()

  private val _state = mutableStateOf(
    SettingsState(
      showMenuAtLaunch = menuPreferences.showsAtLaunch,
      isShakeEnable = menuPreferences.motionGestureEnabled,
      isThreeFingerLongPressEnable = menuPreferences.touchGestureEnabled,
      isKeyCommandEnabled = menuPreferences.keyCommandsEnabled,
      applicationInfo = appService.applicationInfo,
      showFabAtLaunch = menuPreferences.showFab,
      filterByPackageName = nsdPreferences.filterByPackageName,
      filterBySlug = nsdPreferences.filterBySlug,
      filterByUsername = nsdPreferences.filterByUsername
    )
  )

  val state
    get() = _state.value

  private val menuListener = {
    _state.value = _state.value.copy(
      showMenuAtLaunch = menuPreferences.showsAtLaunch,
      isShakeEnable = menuPreferences.motionGestureEnabled,
      isThreeFingerLongPressEnable = menuPreferences.touchGestureEnabled,
      isKeyCommandEnabled = menuPreferences.keyCommandsEnabled,
      showFabAtLaunch = menuPreferences.showFab
    )
  }

  private val nsdListener = {
    _state.value = _state.value.copy(
      filterByPackageName = nsdPreferences.filterByPackageName,
      filterBySlug = nsdPreferences.filterBySlug,
      filterByUsername = nsdPreferences.filterByUsername
    )
  }

  init {
    menuPreferences.addOnChangeListener(menuListener)
    nsdPreferences.addOnChangeListener(nsdListener)
  }

  override fun onCleared() {
    super.onCleared()
    menuPreferences.removeOnChangeListener(menuListener)
    nsdPreferences.removeOnChangeListener(nsdListener)
  }

  fun onAction(action: SettingsAction) {
    when (action) {
      is SettingsAction.ToggleShowMenuAtLaunch -> menuPreferences.showsAtLaunch = action.newValue
      is SettingsAction.ToggleShakeEnable -> menuPreferences.motionGestureEnabled = action.newValue
      is SettingsAction.ToggleThreeFingerLongPressEnable -> menuPreferences.touchGestureEnabled = action.newValue
      is SettingsAction.ToggleKeyCommandEnable -> menuPreferences.keyCommandsEnabled = action.newValue
      is SettingsAction.ToggleShowFabAtLaunch -> menuPreferences.showFab = action.newValue
      is SettingsAction.ToggleFilterByPackageName -> nsdPreferences.filterByPackageName = action.newValue
      is SettingsAction.UpdateFilterBySlug -> nsdPreferences.filterBySlug = action.newValue
      is SettingsAction.ToggleFilterByUsername -> nsdPreferences.filterByUsername = action.newValue
    }
  }
}
