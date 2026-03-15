package expo.modules.plugin

import expo.modules.plugin.gradle.addBuildCache
import expo.modules.plugin.gradle.beforeRootProject
import expo.modules.plugin.gradle.loadLocalProperties
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.withColor
import expo.modules.plugin.utils.getPropertiesPrefixedBy
import org.gradle.api.Plugin
import org.gradle.api.UnknownProjectException
import org.gradle.api.initialization.Settings
import org.gradle.internal.cc.base.logger
import org.gradle.plugins.ide.eclipse.model.EclipseModel
import java.io.File
import java.util.Properties

open class ExpoAutolinkingSettingsPlugin : Plugin<Settings> {
  override fun apply(settings: Settings) {
    // Adds a property to the settings that indicates that the `expo-autolinking-plugin` is available.
    settings.gradle.extensions.extraProperties.set("expoAutolinkingSettingsPlugin", true)

    settings.addBuildCache()

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
          .apply {
            add("classpath", "expo.modules:expo-autolinking-plugin")
            add("classpath", "expo.modules:expo-max-sdk-override-plugin")
          }
      }

      // Includes the `expo-gradle-plugin` subproject.
      settings.includeBuild(
        expoGradlePluginsFile.absolutePath
      )
    }

    configureMaxSdkOverridePlugin(settings)
    configureEclipseResourceFilters(settings)
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

  private fun configureMaxSdkOverridePlugin(settings: Settings) {
    settings.gradle.beforeRootProject { rootProject ->
      try {
        rootProject.project(":app") { appProject ->
          appProject.pluginManager.withPlugin("com.android.application") {
            appProject.pluginManager.apply("expo-max-sdk-override-plugin")
          }
        }
      } catch (e: UnknownProjectException) {
        logger.error(
          " ℹ️  Failed to apply gradle plugin ".withColor(Colors.RESET)
            + "'expo-max-sdk-override-plugin'".withColor(Colors.GREEN)
            + ". Plugin has failed to find the ':app' project. It will not be applied.".withColor(Colors.RESET)
        )
      }
    }
  }

  /**
   * Configures Eclipse resource filters to exclude package manager directories from IDE scanning.
   * This prevents IDEs (VSCode with Gradle extension, Android Studio, Eclipse) from creating
   * `.project` metadata files in nested node_modules paths, which can cause autolinking to
   * resolve incomplete package directories.
   */
  private fun configureEclipseResourceFilters(settings: Settings) {
    settings.gradle.afterProject { project ->
      // Only configure for root project to avoid duplicate filters
      if (project != project.rootProject) {
        return@afterProject
      }

      try {
        project.pluginManager.apply("eclipse")

        project.extensions.configure(EclipseModel::class.java) { eclipse ->
          eclipse.project { eclipseProject ->
            // Exclude package manager directories using regex filter
            // This prevents IDE from scanning inside these folders and creating .project files
            eclipseProject.resourceFilter {
              it.appliesTo = "FOLDERS"
              it.type = "EXCLUDE_ALL"
              it.recursive = true
              it.matcher { matcher ->
                matcher.id = "org.eclipse.core.resources.regexFilterMatcher"
                // Exclude: node_modules (all), .bun, .yarn (berry), .pnpm
                matcher.arguments = "node_modules|\\.bun|\\.yarn|\\.pnpm"
              }
            }
          }
        }
      } catch (e: Exception) {
        // Silently ignore if eclipse plugin is not available or fails
        // This is not critical functionality
      }
    }
  }
}
