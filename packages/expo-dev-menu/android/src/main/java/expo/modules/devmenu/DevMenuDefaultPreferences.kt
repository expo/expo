package expo.modules.devmenu

import expo.interfaces.devmenu.DevMenuPreferencesInterface

open class DevMenuDefaultPreferences : DevMenuPreferencesInterface {
  private fun methodUnavailable() {
    throw NoSuchMethodError("You cannot change the default settings. Export `DevMenuSettings` module if you want to change the settings.")
  }

  override var motionGestureEnabled: Boolean
    get() = true
    set(_) = methodUnavailable()

  override var touchGestureEnabled: Boolean
    get() = true
    set(_) = methodUnavailable()

  override var keyCommandsEnabled: Boolean
    get() = true
    set(_) = methodUnavailable()

  override var showsAtLaunch: Boolean
    get() = false
    set(_) = methodUnavailable()

  override var isOnboardingFinished: Boolean
    get() = true
    set(_) = methodUnavailable()
}
