package expo.modules.devmenu.modules

import android.content.Context.MODE_PRIVATE
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule

private const val DEV_SETTINGS_PREFERENCES = "expo.modules.devmenu.sharedpreferences"
private const val DEV_MENU_SETTINGS_MODULE = "DevMenuSettings"

@ReactModule(name = DEV_MENU_SETTINGS_MODULE)
class DevMenuSettings(context: ReactApplicationContext) : BaseJavaModule() {
  private val sharedPreferences = context.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)

  override fun getName() = DEV_MENU_SETTINGS_MODULE

  var motionGestureEnabled: Boolean
    get() = sharedPreferences.getBoolean("motionGestureEnabled", true)
    set(value) = saveBoolean("motionGestureEnabled", value)

  var touchGestureEnabled: Boolean
    get() = sharedPreferences.getBoolean("touchGestureEnabled", true)
    set(value) = saveBoolean("touchGestureEnabled", value)

  var keyCommandsEnabled: Boolean
    get() = sharedPreferences.getBoolean("keyCommandsEnabled", true)
    set(value) = saveBoolean("keyCommandsEnabled", value)

  var showsAtLaunch: Boolean
    get() = sharedPreferences.getBoolean("showsAtLaunch", false)
    set(value) = saveBoolean("showsAtLaunch", value)

  var isOnboardingFinished: Boolean
    get() = sharedPreferences.getBoolean("isOnboardingFinished", false)
    set(value) = saveBoolean("isOnboardingFinished", value)

  fun serialize(): WritableMap =
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
