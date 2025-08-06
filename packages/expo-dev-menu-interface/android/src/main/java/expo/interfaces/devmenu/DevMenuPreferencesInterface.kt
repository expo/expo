package expo.interfaces.devmenu

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
   * Whether to show a floating action button that pulls up the DevMenu when pressed.
   */
  var showFab: Boolean
}
