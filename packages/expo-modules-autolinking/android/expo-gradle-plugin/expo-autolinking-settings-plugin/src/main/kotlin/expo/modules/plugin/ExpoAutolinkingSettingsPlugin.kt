package expo.modules.plugin

import expo.modules.plugin.gradle.beforeRootProject
import org.gradle.api.Plugin
import org.gradle.api.initialization.Settings
import java.io.File

open class ExpoAutolinkingSettingsPlugin : Plugin<Settings> {
  override fun apply(settings: Settings) {
    // Adds a property to the settings that indicates that the `expo-autolinking-plugin` is available.
    settings.gradle.extensions.extraProperties.set("expoAutolinkingSettingsPlugin", true)

    // Creates an extension that allows users to link expo modules and add additional configuration.
    settings.extensions.create("expoAutolinking", ExpoAutolinkingSettingsExtension::class.java, settings)

    val expoGradlePluginsFile = getExpoGradlePluginsFile(settings)
    // If the `expo-gradle-plugin` is available, it will be included in the settings.
    // It won't be available in our test project or when we decide to prebuild plugin.
    if (expoGradlePluginsFile.exists()) {
      settings.gradle.beforeRootProject { rootProject ->
        // Adds the `expo-autolinking-plugin` to the root project, so it will be available for all subprojects.
        rootProject
          .buildscript
          .dependencies
          .add("classpath", "expo.modules:expo-autolinking-plugin")
      }

      // Includes the `expo-gradle-plugin` subproject.
      settings.includeBuild(
        expoGradlePluginsFile.absolutePath
      )
    }
  }

  private fun getExpoGradlePluginsFile(settings: Settings): File {
    val expoModulesAutolinkingPath =
      settings.providers.exec { env ->
        env.workingDir(settings.rootDir)
        env.commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")
      }.standardOutput.asText.get().trim()

    val expoAutolinkingDir = File(expoModulesAutolinkingPath).parentFile

    return File(
      expoAutolinkingDir,
      "android/expo-gradle-plugin"
    )
  }
}
