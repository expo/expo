package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.gradle.afterAndroidApplicationProject
import expo.modules.plugin.gradle.applyAarProject
import expo.modules.plugin.gradle.applyPlugin
import expo.modules.plugin.gradle.beforeRootProject
import expo.modules.plugin.gradle.linkAarProject
import expo.modules.plugin.gradle.linkBuildDependence
import expo.modules.plugin.gradle.linkMavenRepository
import expo.modules.plugin.gradle.linkPlugin
import expo.modules.plugin.gradle.linkProject
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.Emojis
import org.gradle.api.Project
import org.gradle.api.initialization.Settings

class SettingsManager(
  val settings: Settings,
  searchPaths: List<String>? = null,
  ignorePaths: List<String>? = null,
  exclude: List<String>? = null
) {
  private val autolinkingOptions = AutolinkingOptions(
    searchPaths,
    ignorePaths,
    exclude
  )

  /**
   * Resolved configuration from `expo-modules-autolinking`.
   */
  private val config by lazy {
    val command = AutolinkigCommandBuilder()
      .command("resolve")
      .useJson()
      .useAutolinkingOptions(autolinkingOptions)
      .build()

    val result = settings.providers.exec { env ->
      env.workingDir(settings.rootDir)
      env.commandLine(command)
    }.standardOutput.asText.get()

    ExpoAutolinkingConfig.decodeFromString(result)
  }

  fun useExpoModules() {
    link()

    settings.gradle.beforeProject { project ->
      // Adds precompiled artifacts
      config.allAarProjects
        .filter { it.name == project.name }
        .forEach(project::applyAarProject)
    }

    settings.gradle.beforeRootProject { rootProject: Project ->
      config.allPlugins.forEach(rootProject::linkBuildDependence)
      config.extraDependencies.forEach { mavenConfig ->
        rootProject.logger.quiet("Adding extra maven repository: ${mavenConfig.url}")
        rootProject.linkMavenRepository(mavenConfig)
      }
    }

    settings.gradle.afterAndroidApplicationProject { androidApplication ->
      config
        .allPlugins
        .filter { it.applyToRootProject }
        .forEach { plugin ->
          androidApplication.logger.quiet(" ${Emojis.INFORMATION}  ${Colors.YELLOW}Applying gradle plugin${Colors.RESET} '${Colors.GREEN}${plugin.id}${Colors.RESET}'")
          androidApplication.applyPlugin(plugin)
        }
    }

    settings.gradle.extensions.create("expoGradle", ExpoGradleExtension::class.java, config, autolinkingOptions)
  }

  /**
   * Links all projects, plugins and aar projects.
   */
  private fun link() = with(config) {
    allProjects.forEach(settings::linkProject)
    allPlugins.forEach(settings::linkPlugin)
    allAarProjects.forEach(settings::linkAarProject)
  }
}
