package expo.modules.devmenu.modules

import android.app.Application
import android.content.Context.MODE_PRIVATE
import android.content.SharedPreferences
import androidx.core.content.edit
import expo.interfaces.devmenu.DevMenuPreferencesInterface

private const val DEV_SETTINGS_PREFERENCES = "expo.modules.devmenu.sharedpreferences"

object DevMenuPreferencesHandle : DevMenuPreferencesInterface {
  private lateinit var sharedPreferences: SharedPreferences

  private val listeners = mutableListOf<() -> Unit>()

  // The preference manager does not currently store a strong reference to the listener.
  private val mainListener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
    listeners.forEach { it() }
  }

  fun init(application: Application) {
    sharedPreferences = application.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)
    sharedPreferences.registerOnSharedPreferenceChangeListener(mainListener)
  }

  fun addOnChangeListener(listener: () -> Unit) {
    listeners.add(listener)
  }

  fun removeOnChangeListener(listener: () -> Unit) {
    listeners.remove(listener)
  }

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

  private fun saveBoolean(key: String, value: Boolean) {
    sharedPreferences
      .edit(commit = true) {
        putBoolean(key, value)
      }
  }
}
