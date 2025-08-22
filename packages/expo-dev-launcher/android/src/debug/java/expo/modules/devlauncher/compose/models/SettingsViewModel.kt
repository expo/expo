package expo.modules.devlauncher.compose.models

import android.app.Application
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.AndroidViewModel
import expo.modules.devlauncher.services.AppService
import expo.modules.devlauncher.services.ApplicationInfo
import expo.modules.devlauncher.services.inject
import expo.modules.devmenu.DevMenuPreferencesHandle

data class SettingsState(
  val showMenuAtLaunch: Boolean = false,
  val isShakeEnable: Boolean = true,
  val isThreeFingerLongPressEnable: Boolean = true,
  val isKeyCommandEnabled: Boolean = true,
  val applicationInfo: ApplicationInfo? = null,
  // TODO @behenate - make true the default for VR
  val showFabAtLaunch: Boolean = false
)

sealed interface SettingsAction {
  data class ToggleShowMenuAtLaunch(val newValue: Boolean) : SettingsAction
  data class ToggleShakeEnable(val newValue: Boolean) : SettingsAction
  data class ToggleThreeFingerLongPressEnable(val newValue: Boolean) : SettingsAction
  data class ToggleKeyCommandEnable(val newValue: Boolean) : SettingsAction
  data class ToggleShowFabAtLaunch(val newValue: Boolean) : SettingsAction
}

class SettingsViewModel(application: Application) : AndroidViewModel(application) {
  private val menuPreferences = DevMenuPreferencesHandle
  private val appService = inject<AppService>()

  private val _state = mutableStateOf(
    SettingsState(
      showMenuAtLaunch = menuPreferences.showsAtLaunch,
      isShakeEnable = menuPreferences.motionGestureEnabled,
      isThreeFingerLongPressEnable = menuPreferences.touchGestureEnabled,
      isKeyCommandEnabled = menuPreferences.keyCommandsEnabled,
      applicationInfo = appService.applicationInfo,
      showFabAtLaunch = menuPreferences.showFab
    )
  )

  val state
    get() = _state.value

  private val listener = {
    _state.value = SettingsState(
      showMenuAtLaunch = menuPreferences.showsAtLaunch,
      isShakeEnable = menuPreferences.motionGestureEnabled,
      isThreeFingerLongPressEnable = menuPreferences.touchGestureEnabled,
      isKeyCommandEnabled = menuPreferences.keyCommandsEnabled,
      showFabAtLaunch = menuPreferences.showFab
    )
  }

  init {
    menuPreferences.addOnChangeListener(listener)
  }

  override fun onCleared() {
    super.onCleared()
    menuPreferences.removeOnChangeListener(listener)
  }

  fun onAction(action: SettingsAction) {
    when (action) {
      is SettingsAction.ToggleShowMenuAtLaunch -> {
        menuPreferences.showsAtLaunch = action.newValue
      }

      is SettingsAction.ToggleShakeEnable -> {
        menuPreferences.motionGestureEnabled = action.newValue
      }

      is SettingsAction.ToggleThreeFingerLongPressEnable -> {
        menuPreferences.touchGestureEnabled = action.newValue
      }

      is SettingsAction.ToggleKeyCommandEnable -> {
        menuPreferences.keyCommandsEnabled = action.newValue
      }

      is SettingsAction.ToggleShowFabAtLaunch -> {
        menuPreferences.showFab = action.newValue
      }
    }
  }
}
