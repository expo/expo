package expo.modules.plugin

import org.gradle.api.initialization.Settings

open class ExpoAutolinkingSettingsExtension(val settings: Settings) {
  /**
   * Command that should be provided to `react-native` to resolve the configuration.
   */
  val rnConfigCommand = AutolinkigCommandBuilder()
    .command("react-native-config")
    .useJson()
    .build()

  /**
   * A list of paths relative to the app's root directory where
   * the autolinking script should search for Expo modules.
   */
  var searchPaths: List<String>? = null

  /**
   * Paths to ignore when looking up for modules.
   */
  var ignorePaths: List<String>? = null

  /**
   * Package names to exclude when looking up for modules.
   */
  var exclude: List<String>? = null

  /**
   * Uses Expo modules autolinking.
   */
  fun useExpoModules() {
    SettingsManager(
      settings,
      searchPaths,
      ignorePaths,
      exclude
    ).useExpoModules()
  }
}
