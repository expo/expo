package expo.modules.devmenu

/**
 * Overrides that aren't persisted, so they can't change the preferences saved by the user. They're
 * assigned by `expo-dev-launcher` on each app load from the `disableFab` and `disableAutoLaunch`
 * params of the url that the app was opened with, and reset when it's loaded without them.
 */
object DevMenuSessionOverrides {
  /**
   * Whether to hide the floating action button regardless of the saved preference.
   */
  @Volatile
  var isFabDisabled: Boolean = false

  /**
   * Whether to prevent the dev menu from opening when the app starts.
   */
  @Volatile
  var isAutoLaunchDisabled: Boolean = false
}
