package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoAutolinkingConfig
import expo.modules.plugin.configuration.GradleProject
import expo.modules.plugin.gradle.afterAndroidApplicationProject
import expo.modules.plugin.gradle.applyAarProject
import expo.modules.plugin.gradle.applyPlugin
import expo.modules.plugin.gradle.beforeProject
import expo.modules.plugin.gradle.beforeRootProject
import expo.modules.plugin.gradle.linkAarProject
import expo.modules.plugin.gradle.linkBuildDependence
import expo.modules.plugin.gradle.linkLocalMavenRepository
import expo.modules.plugin.gradle.linkMavenRepository
import expo.modules.plugin.gradle.linkPlugin
import expo.modules.plugin.gradle.linkProject
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.Emojis
import expo.modules.plugin.text.withColor
import groovy.lang.Binding
import groovy.lang.GroovyShell
import org.gradle.api.Project
import org.gradle.api.initialization.Settings
import org.gradle.api.logging.Logging
import org.gradle.internal.extensions.core.extra
import java.io.File

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

  private val groovyShell by lazy {
    val binding = Binding()
    binding.setVariable("providers", settings.providers)
    GroovyShell(javaClass.classLoader, binding)
  }

  private val logger by lazy {
    Logging.getLogger(Settings::class.java)
  }

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

    val decodedConfig = ExpoAutolinkingConfig.decodeFromString(result)
    configurePublication(decodedConfig)
    return@lazy decodedConfig
  }

  private fun configurePublication(config: ExpoAutolinkingConfig) {
    config.allProjects.forEach { project ->
      if (project.publication != null) {
        val forceBuildFromSource = config.configuration.buildFromSourceRegex.any {
          it.matches(project.name)
        }

        project.configuration.shouldUsePublication = !forceBuildFromSource && evaluateShouldUsePublicationScript(project)
      }
    }
  }

  private fun evaluateShouldUsePublicationScript(project: GradleProject): Boolean {
    // If the path to the script is not defined, we assume that the publication should be used.
    val scriptPath = project.shouldUsePublicationScriptPath
      ?: return true

    val scriptFile = File(scriptPath)

    // If the path is invalid, we assume that the publication should be used.
    if (!scriptFile.exists()) {
      logger.warn("[ExpoAutolinkingPlugin] The script file does not exist: $scriptPath")
      return false
    }

    val result = groovyShell.run(scriptFile, emptyArray<String>())
    return result as? Boolean == true
  }

  fun useExpoModules() {
    link()

    settings.gradle.beforeProject { project ->
      // Adds precompiled artifacts
      config.allAarProjects.filter { it.name == project.name }
        .forEach(
          project::applyAarProject
        )
    }

    // Defines the required features for the core module
    settings.gradle.beforeProject("expo-modules-core") { project ->
      project.extra.set("coreFeatures", config.coreFeatures)
    }

    settings.gradle.beforeRootProject { rootProject: Project ->
      val extraDependency = config.extraDependencies
      extraDependency.forEach { mavenConfig ->
        rootProject.logger.quiet("Adding extra maven repository: ${mavenConfig.url}")

      }
      rootProject.allprojects { project ->
        extraDependency.forEach { mavenConfig ->
          project.linkMavenRepository(mavenConfig)
        }
      }

      config.allPlugins.forEach(rootProject::linkBuildDependence)

      // Adds maven repositories for all projects that are using the publication.
      // It most likely means that we will add "https://maven.pkg.github.com/expo/expo" to the repositories.
      val localRepositories = config
        .allProjects
        .filter { it.usePublication && it.publication?.repository != "mavenLocal" }
        .mapNotNull {
          val publication = it.publication
            ?: return@mapNotNull null

          "${it.sourceDir}/../${publication.repository}" to publication
        }
        .groupBy({ it.first }, { it.second })

      rootProject.allprojects { project ->
        localRepositories.forEach { (path, publications) ->
          project.linkLocalMavenRepository(path, publications)
        }
      }
    }

    settings.gradle.afterAndroidApplicationProject { androidApplication ->
      config
        .allPlugins
        .filter { it.applyToRootProject }
        .forEach { plugin ->
          androidApplication.logger.quiet(" ${Emojis.INFORMATION}  ${"Applying gradle plugin".withColor(Colors.YELLOW)} '${plugin.id.withColor(Colors.GREEN)}'")
          androidApplication.applyPlugin(plugin)
        }
    }

    settings.gradle.extensions.create("expoGradle", ExpoGradleExtension::class.java, config, autolinkingOptions)
  }

  /**
   * Links all projects, plugins and aar projects.
   */
  private fun link() = with(config) {
    allProjects.forEach { project ->
      if (!project.usePublication) {
        settings.linkProject(project)
      }
    }
    allPlugins.forEach(settings::linkPlugin)
    allAarProjects.forEach(settings::linkAarProject)
  }
}
