package expo.modules.devmenu

import android.app.Application
import android.content.Context.MODE_PRIVATE
import android.content.SharedPreferences
import expo.modules.devmenu.helpers.preferences

private const val DEV_SETTINGS_PREFERENCES = "expo.modules.devmenu.sharedpreferences"

interface DevMenuPreferences {
  /**
   * Adds a listener that will be called whenever any preference changes.
   */
  fun addOnChangeListener(listener: () -> Unit)

  /**
   * Removes a previously added listener.
   */
  fun removeOnChangeListener(listener: () -> Unit)

  /**
   * Whether to enable shake gesture.
   */
  var motionGestureEnabled: Boolean

  /**
   * Whether to enable three-finger long press gesture.
   */
  var touchGestureEnabled: Boolean

  /**
   * Whether to enable key commands.
   */
  var keyCommandsEnabled: Boolean

  /**
   * Whether to automatically show the dev menu once its delegate is set and the bridge is loaded.
   */
  var showsAtLaunch: Boolean

  /**
   * Returns `true` only if the user finished onboarding, `false` otherwise.
   */
  var isOnboardingFinished: Boolean

  /**
   * Whether to show a floating action button that pulls up the DevMenu at launch.
   */
  var showFab: Boolean
}

class DevMenuDefaultPreferences(
  application: Application
) : DevMenuPreferences {
  private val sharedPreferences = application.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)

  private val listeners = mutableListOf<() -> Unit>()

  // The preference manager does not currently store a strong reference to the listener.
  private val mainListener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
    listeners.forEach { it() }
  }

  init {
    sharedPreferences.registerOnSharedPreferenceChangeListener(mainListener)
  }

  override fun addOnChangeListener(listener: () -> Unit) {
    listeners.add(listener)
  }

  override fun removeOnChangeListener(listener: () -> Unit) {
    listeners.remove(listener)
  }

  override var motionGestureEnabled: Boolean
    by preferences(sharedPreferences, true)

  override var touchGestureEnabled: Boolean
    by preferences(sharedPreferences, true)

  override var keyCommandsEnabled: Boolean
    by preferences(sharedPreferences, true)

  override var showsAtLaunch: Boolean
    by preferences(sharedPreferences, false)

  override var isOnboardingFinished: Boolean
    by preferences(sharedPreferences, false)

  override var showFab: Boolean
    by preferences(sharedPreferences, true)
}
