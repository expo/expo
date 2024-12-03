package expo.modules.plugin

import org.gradle.api.initialization.Settings

open class ExpoAutolinkingSettingsExtension(settings: Settings) {
  private val settingsManager = SettingsManager(settings)

  /**
   * Command that should be provided to the `react-native` to resolve the configuration.
   */
  val rnConfigCommand = AutolinkigCommandBuilder()
    .command("react-native-config")
    .useJson()
    .build()

  /**
   * Uses Expo modules autolinking.
   */
  fun useExpoModules() {
    settingsManager.useExpoModules()
  }
}
