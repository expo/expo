package expo.modules.devlauncher.compose

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import expo.modules.devmenu.modules.DevMenuPreferencesHandle

data class SettingsState(
  val showMenuAtLaunch: Boolean = false,
  val isShakeEnable: Boolean = true,
  val isThreeFingerLongPressEnable: Boolean = true,
  val isKeyCommandEnabled: Boolean = true
)

sealed interface SettingsAction {
  data class ToggleShowMenuAtLaunch(val newValue: Boolean) : SettingsAction
  data class ToggleShakeEnable(val newValue: Boolean) : SettingsAction
  data class ToggleThreeFingerLongPressEnable(val newValue: Boolean) : SettingsAction
  data class ToggleKeyCommandEnable(val newValue: Boolean) : SettingsAction
}

class SettingsViewModel : ViewModel() {
  private val menuPreferences = DevMenuPreferencesHandle

  private val _state = mutableStateOf(
    SettingsState(
      showMenuAtLaunch = menuPreferences.showsAtLaunch,
      isShakeEnable = menuPreferences.motionGestureEnabled,
      isThreeFingerLongPressEnable = menuPreferences.touchGestureEnabled,
      isKeyCommandEnabled = menuPreferences.keyCommandsEnabled
    )
  )

  val state
    get() = _state.value

  private val listener = {
    _state.value = SettingsState(
      showMenuAtLaunch = menuPreferences.showsAtLaunch,
      isShakeEnable = menuPreferences.motionGestureEnabled,
      isThreeFingerLongPressEnable = menuPreferences.touchGestureEnabled,
      isKeyCommandEnabled = menuPreferences.keyCommandsEnabled
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
    }
  }
}
