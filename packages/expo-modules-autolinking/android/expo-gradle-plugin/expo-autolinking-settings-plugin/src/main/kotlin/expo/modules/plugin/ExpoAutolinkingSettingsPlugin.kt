package expo.modules.plugin

import expo.modules.plugin.gradle.beforeRootProject
import org.gradle.api.Plugin
import org.gradle.api.initialization.Settings
import java.io.File
import kotlin.text.trim

open class ExpoAutolinkingSettingsPlugin : Plugin<Settings> {
  override fun apply(settings: Settings) {
    // Creates an extension that allows users to link expo modules and add additional configuration.
    settings.extensions.create("expoAutolinking", ExpoAutolinkingSettingsExtension::class.java, settings)

    settings.gradle.beforeRootProject { rootProject ->
      // Adds the `expo-autolinking-plugin` to the root project, so it will be available for all subprojects.
      rootProject
        .buildscript
        .dependencies
        .add("classpath", "expo.modules:expo-autolinking-plugin")
    }

    val expoGradlePluginPath = getExpoGradlePluginPath(settings)
    // Includes the `expo-gradle-plugin` subproject.
    settings.includeBuild(
      expoGradlePluginPath
    )
  }

  private fun getExpoGradlePluginPath(settings: Settings): File {
    return File(
      settings.providers.exec { env ->
        env.workingDir(settings.rootDir)
        env.commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json')")
      }.standardOutput.asText.get().trim(),
      "../android/expo-gradle-plugin"
    )
  }
}
