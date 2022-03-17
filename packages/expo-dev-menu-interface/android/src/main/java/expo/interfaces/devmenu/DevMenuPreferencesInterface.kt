package expo.interfaces.devmenu

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

interface DevMenuPreferencesInterface {
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
   * Serializes settings into a [WritableMap] so they can be passed through the bridge.
   */
  fun serialize(): WritableMap

  /**
   * Updates settings from [ReadableMap] - the map can be a partial of all the possible settings options
   */
  fun setPreferences(settings: ReadableMap)
}
