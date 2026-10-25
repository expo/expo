package expo.modules.plugin

import com.android.build.api.dsl.ApplicationExtension
import com.android.build.api.dsl.LibraryExtension
import com.android.build.api.variant.AndroidComponentsExtension
import expo.modules.plugin.configuration.ExpoModule
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.withColor
import org.gradle.api.GradleException
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.Directory
import org.gradle.api.plugins.UnknownPluginException
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.TaskProvider

const val generatedPackageListNamespace = "expo.modules"
const val generatedPackageListFilename = "ExpoModulesPackageList.kt"
const val generatedFilesSrcDir = "generated/expo/src/main/java"

/**
 * The Gradle plugin that registers the Expo Modules v2 Kotlin compiler plugin. It expands the
 * `discoveredExpoModules()` call in the `expo` package's `ExpoModulesV2ModuleList`.
 */
const val expoModulesV2PluginId = "io.github.expo.modules.v2"

open class ExpoAutolinkingPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val gradleExtension = project.gradle.extensions.findByType(ExpoGradleExtension::class.java)
      ?: throw IllegalStateException("`ExpoGradleExtension` not found. Please, make sure that `useExpoModules` was called in `settings.gradle`.")
    val config = gradleExtension.config

    project.logger.quiet("")
    project.logger.quiet("Using expo modules")

    val appProject = findAppProject(project.rootProject)
    appProject?.let { copyAppDimensionsAndFlavorsToProject(project, it) }

    val (prebuiltProjects, projects) = config.allProjects.partition { project ->
      project.usePublication
    }

    project.withSubprojects(projects) { subproject ->
      // Ensures that dependencies are resolved before the project is evaluated.
      project.evaluationDependsOn(subproject.path)
      // Adds the subproject as a dependency to the current project (expo package).
      project.dependencies.add("api", subproject)

      project.logger.quiet("  - ${subproject.name.withColor(Colors.GREEN)} (${subproject.version})")
    }

    prebuiltProjects.forEach { prebuiltProject ->
      val publication = requireNotNull(prebuiltProject.publication)
      project.dependencies.add("api", "${publication.groupId}:${publication.artifactId}:${publication.version}")

      project.logger.quiet("  - ${"[\uD83D\uDCE6]".withColor(Colors.YELLOW)} ${prebuiltProject.name.withColor(Colors.GREEN)} (${publication.version})")
    }

    project.logger.quiet("")

    // The `expo` package's ExpoModulesV2ModuleList is filled in by the compiler, so this project
    // has to compile with the Expo Modules v2 compiler plugin.
    applyExpoModulesV2CompilerPlugin(project)

    // Creates the tasks that generate the expo module package list and the inline modules list.
    val generatePackagesList = createGeneratePackagesListTask(project, gradleExtension.config.modules, gradleExtension.hash)
    val generateInlineModules = createGenerateInlineModulesTask(project)

    // Ensures the generators run before the build.
    project.tasks
      .named("preBuild", Task::class.java)
      .configure { it.dependsOn(generatePackagesList, generateInlineModules) }

    // Registers the generated sources through the Variant Sources API. AGP 9 only compiles .kt
    // files from the variant `kotlin` sources and disallows Provider instances in the legacy
    // SourceSet API.
    val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)
    androidComponents.onVariants { variant ->
      @Suppress("UnstableApiUsage")
      val kotlinSource = requireNotNull(variant.sources.kotlin) { "Can't access kotlin source sets" }

      with(kotlinSource) {
        addGeneratedSourceDirectory(generatePackagesList) { it.outputDirectory }
        addGeneratedSourceDirectory(generateInlineModules) { it.outputDirectory }
      }
    }
  }

  private fun applyExpoModulesV2CompilerPlugin(project: Project) {
    if (project.plugins.hasPlugin(expoModulesV2PluginId)) {
      return
    }

    try {
      project.pluginManager.apply(expoModulesV2PluginId)
    } catch (e: UnknownPluginException) {
      throw GradleException(
        "Expo autolinking cannot apply the `$expoModulesV2PluginId` Gradle plugin to `${project.path}`, " +
          "so `ExpoModulesV2ModuleList` would not compile. The plugin ships with " +
          "`expo-module-gradle-plugin`; apply that plugin in `${project.path}` before `expo-autolinking`, " +
          "or check that `expo-modules-core` and `expo-modules-autolinking` come from the same Expo SDK version.",
        e
      )
    }
  }

  fun getPackageListDir(project: Project): Provider<Directory> {
    return project.layout.buildDirectory.dir(generatedFilesSrcDir)
  }

  fun getInlineModulesDir(project: Project): Provider<Directory> {
    return project.layout.buildDirectory.dir("inline/modules")
  }

  fun createGeneratePackagesListTask(project: Project, modules: List<ExpoModule>, hash: String): TaskProvider<GeneratePackagesListTask> {
    return project.tasks.register("generatePackagesList", GeneratePackagesListTask::class.java) {
      it.hash.set(hash)
      it.namespace.set(generatedPackageListNamespace)
      it.outputDirectory.set(getPackageListDir(project))
      it.modules = modules
    }
  }

  fun createGenerateInlineModulesTask(project: Project): TaskProvider<GenerateInlineModulesTask> {
    return project.tasks.register("generateInlineModules", GenerateInlineModulesTask::class.java) {
      it.nodeWorkingDir.set(project.rootProject.layout.projectDirectory)
      it.mirrorDirectory.set(project.layout.projectDirectory.dir("src/main/java/inline/modules"))
      it.outputDirectory.set(getInlineModulesDir(project))
      it.watchedDirectoriesSerialized.set(
        (project.findProperty("expo.inlineModules.watchedDirectories")
          ?: emptyList<String>()).toString()
      )
    }
  }

  private fun findAppProject(root: Project): Project? {
    return root.allprojects.firstOrNull { it.plugins.hasPlugin("com.android.application") }
  }

  private fun copyAppDimensionsAndFlavorsToProject(
    project: Project,
    appProject: Project
  ) {
    val appAndroid = appProject.extensions.findByName("android") as? ApplicationExtension ?: run {
      return
    }
    val consumerAndroid = project.extensions.findByName("android") as? LibraryExtension ?: run {
      return
    }

    val appDimensions = syncFlavorDimensions(project, consumerAndroid, appAndroid)
    copyMissingProductFlavors(project, consumerAndroid, appAndroid, appDimensions)
  }

  private fun syncFlavorDimensions(
    project: Project,
    consumerAndroid: LibraryExtension,
    appAndroid: ApplicationExtension
  ): List<String> {
    val appDimensions = appAndroid
      .flavorDimensions
      .takeIf { it.isNotEmpty() }
      ?: return emptyList()

    val consumerDimensions = (consumerAndroid.flavorDimensions).toMutableList()
    val dimensionsAdded = appDimensions.any { dimension ->
      if (dimension !in consumerDimensions) {
        consumerDimensions.add(dimension)
        true
      } else {
        false
      }
    }

    if (dimensionsAdded) {
      consumerAndroid.flavorDimensions.clear()
      consumerAndroid.flavorDimensions.addAll(consumerDimensions)
      project.logger.quiet("  -> Copied/merged flavorDimensions: ${consumerDimensions.joinToString()}")
    }

    return appDimensions
  }

  private fun copyMissingProductFlavors(
    project: Project,
    consumerAndroid: LibraryExtension,
    appAndroid: ApplicationExtension,
    appDimensions: List<String>
  ) {
    val appFlavors = appAndroid.productFlavors
    val consumerFlavors = consumerAndroid.productFlavors
    val existingFlavorNames = consumerFlavors.map { it.name }.toSet()

    appFlavors.forEach { appFlavor ->
      if (appFlavor.name !in existingFlavorNames) {
        val dimension = appFlavor.dimension ?: appDimensions.singleOrNull()

        consumerFlavors.create(appFlavor.name).apply {
          this.dimension = dimension
        }

        project.logger.quiet("  -> Created flavor '${appFlavor.name}' (dimension='$dimension') in :${project.path}")
      }
    }
  }
}
