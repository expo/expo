package expo.modules.devmenu

/**
 * Overrides that are scoped to the lifetime of the process and aren't persisted, so they can't
 * change the preferences saved by the user. They're set by `expo-dev-launcher` when the app is
 * opened with the `disableFab=1` or `disableAutoLaunch=1` deep link params.
 */
object DevMenuSessionOverrides {
  /**
   * Whether to hide the floating action button regardless of the saved preference.
   */
  var isFabDisabled: Boolean = false

  /**
   * Whether to prevent the dev menu from opening when the app starts.
   */
  var isAutoLaunchDisabled: Boolean = false
}
