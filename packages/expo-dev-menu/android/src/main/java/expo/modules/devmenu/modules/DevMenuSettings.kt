package expo.modules.devmenu.modules

import android.content.Context.MODE_PRIVATE
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import expo.interfaces.devmenu.DevMenuSettingsInterface

private const val DEV_SETTINGS_PREFERENCES = "expo.modules.devmenu.sharedpreferences"
private const val DEV_MENU_SETTINGS_MODULE = "DevMenuSettings"

/**
 * Class that represents all settings connected with the current [expo.modules.devmenu.interfaces.DevMenuDelegateInterface].
 */
@ReactModule(name = DEV_MENU_SETTINGS_MODULE)
class DevMenuSettings(context: ReactApplicationContext) : BaseJavaModule(), DevMenuSettingsInterface {
  private val sharedPreferences = context.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)

  override fun getName() = DEV_MENU_SETTINGS_MODULE

  /**
   * Whether to enable shake gesture.
   */
  override var motionGestureEnabled: Boolean
    get() = sharedPreferences.getBoolean("motionGestureEnabled", true)
    set(value) = saveBoolean("motionGestureEnabled", value)

  /**
   * Whether to enable three-finger long press gesture.
   */
  override var touchGestureEnabled: Boolean
    get() = sharedPreferences.getBoolean("touchGestureEnabled", true)
    set(value) = saveBoolean("touchGestureEnabled", value)

  /**
   * Whether to enable key commands.
   */
  override var keyCommandsEnabled: Boolean
    get() = sharedPreferences.getBoolean("keyCommandsEnabled", true)
    set(value) = saveBoolean("keyCommandsEnabled", value)

  /**
   * Whether to automatically show the dev menu once its delegate is set and the bridge is loaded.
   */
  override var showsAtLaunch: Boolean
    get() = sharedPreferences.getBoolean("showsAtLaunch", false)
    set(value) = saveBoolean("showsAtLaunch", value)

  /**
   * Returns `true` only if the user finished onboarding, `false` otherwise.
   */
  override var isOnboardingFinished: Boolean
    get() = sharedPreferences.getBoolean("isOnboardingFinished", false)
    set(value) = saveBoolean("isOnboardingFinished", value)

  /**
   * Serializes settings into a [WritableMap] so they can be passed through the bridge.
   */
  override fun serialize(): WritableMap =
    Arguments
      .createMap()
      .apply {
        putBoolean("motionGestureEnabled", motionGestureEnabled)
        putBoolean("touchGestureEnabled", touchGestureEnabled)
        putBoolean("keyCommandsEnabled", keyCommandsEnabled)
        putBoolean("showsAtLaunch", showsAtLaunch)
        putBoolean("isOnboardingFinished", isOnboardingFinished)
      }

  private fun saveBoolean(key: String, value: Boolean) {
    sharedPreferences
      .edit()
      .putBoolean(key, value)
      .apply()
  }
}
