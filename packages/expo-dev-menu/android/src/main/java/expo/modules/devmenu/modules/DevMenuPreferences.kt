package expo.modules.devmenu.modules

import android.content.Context
import android.content.Context.MODE_PRIVATE
import com.facebook.react.bridge.*
import expo.interfaces.devmenu.DevMenuPreferencesInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val DEV_SETTINGS_PREFERENCES = "expo.modules.devmenu.sharedpreferences"

class DevMenuPreferencesHandle(context: Context) : DevMenuPreferencesInterface {
  private val sharedPreferences by lazy {
    context.getSharedPreferences(DEV_SETTINGS_PREFERENCES, MODE_PRIVATE)
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

  override fun setPreferences(settings: ReadableMap) {
    if (settings.hasKey("motionGestureEnabled")) {
      motionGestureEnabled = settings.getBoolean("motionGestureEnabled")
    }

    if (settings.hasKey("keyCommandsEnabled")) {
      keyCommandsEnabled = settings.getBoolean("keyCommandsEnabled")
    }

    if (settings.hasKey("showsAtLaunch")) {
      showsAtLaunch = settings.getBoolean("showsAtLaunch")
    }

    if (settings.hasKey("touchGestureEnabled")) {
      touchGestureEnabled = settings.getBoolean("touchGestureEnabled")
    }
  }
}

/**
 * Class that represents all user preferences connected with the current [expo.modules.devmenu.interfaces.DevMenuDelegateInterface].
 */
class DevMenuPreferences : Module() {
  private val preferencesHandel by lazy {
    DevMenuPreferencesHandle(
      appContext.reactContext ?: throw Exceptions.ReactContextLost()
    )
  }
  override fun definition() = ModuleDefinition {
    Name("DevMenuPreferences")

    AsyncFunction<WritableMap>("getPreferencesAsync") {
      preferencesHandel.serialize()
    }

    AsyncFunction("setPreferencesAsync") { settings: ReadableMap ->
      preferencesHandel.setPreferences(settings)
    }
  }
}
