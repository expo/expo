package expo.modules.plugin

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.gradle.LibraryExtension
import org.gradle.api.Project
import org.gradle.api.publish.PublishingExtension

/**
 * Set up artifact publishing for the project.
 *
 * @param project The project to set up publishing for.
 */
internal fun setupPublishing(project: Project) {
  val variants = listOf("brownfieldDebug", "brownfieldRelease", "brownfieldAll")

  project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl {
    val libraryExtension = project.extensions.getByType(LibraryExtension::class.java)
    libraryExtension.applyPublishingVariant()

    project.afterEvaluate {
      val configExtension = getConfigExtension(project)
      val publicationExtension = project.extensions.getByType(PublishingExtension::class.java)

      if (
        publicationExtension == null || variants.any { project.components.getByName(it) == null }
      ) {
        project.logger.warn(
          "Skipping ${project.name} as it can't be published due to missing publishing variants (\"brownfieldDebug, etc.\") or publishing extension"
        )
        return@afterEvaluate
      }

      val rnVersion =
        if (project.name == configExtension.libraryName.get()) {
          getReactNativeVersion(project)
        } else {
          null
        }

      variants.forEach { variant ->
        publicationExtension.createPublication(variant, project, libraryExtension, rnVersion)
      }

      createModuleRelatedTasks(project, rnVersion)
      setupRepositories(publicationExtension, project, configExtension)
    }
  }
}

/**
 * Set up repositories for the project.
 *
 * @param publicationExtension The publishing extension to use.
 * @param project The project to set up repositories for.
 * @param configExtension The extension which specifies repository configuration.
 */
internal fun setupRepositories(
  publicationExtension: PublishingExtension,
  project: Project,
  configExtension: ExpoPublishExtension,
) {
  if (configExtension.publications.isEmpty) {
    throw IllegalStateException(
      "`publications` is not set. Please, make sure that `publications { ... }` was called in the root `build.gradle` file."
    )
  }

  configExtension.publications.forEach { publication ->
    publicationExtension.setupRepository(publication, project)
  }
}

/**
 * Create tasks to remove react-native dependency from the module.json file and set the version for
 * react-android and hermes-android to match the React Native version of the npm project.
 *
 * com.facebook.react:react-native is deprecated and has to be stripped similarly to what React
 * Native Gradle plugin does.
 *
 * Versions for com.facebook.react:react-android and com.facebook.react:hermes-android are set to
 * the same version as the React Native version of the npm project.
 *
 * @param project The project to remove react-native dependency from.
 * @param isBrownfieldProject Whether the project is the brownfield project.
 */
internal fun createModuleRelatedTasks(project: Project, rnVersion: String?) {
  val vairants = listOf("brownfieldDebug", "brownfieldRelease", "brownfieldAll")
  vairants.forEach { variant ->
    createRemoveReactNativeDependencyModuleTask(project, variant)
    if (rnVersion != null) {
      createSetReactNativeVersionModuleTask(project, variant, rnVersion)
    }
  }
}

/**
 * Create and register a task to remove react-native dependency from the module.json file for
 * specific publishing variant.
 *
 * com.facebook.react:react-native is deprecated and has to be stripped similarly to what React
 * Native Gradle plugin does.
 *
 * @param project The project to remove react-native dependency from.
 * @param variant The variant name.
 */
internal fun createRemoveReactNativeDependencyModuleTask(project: Project, variant: String) {
  val removeDependenciesTask =
    project.tasks.register("removeRNDependencyFromModuleFile$variant") { task ->
      task.doLast {
        val moduleFile = project.moduleFile(variant)
        if (moduleFile == null) {
          project.logger.warn("WARNING: Module file for project: ${project.name} does not exist")
          project.logger.warn("This file might not need to be modified. Continuing tasks...")
          return@doLast
        }

        val moduleJson = parseModuleJson(moduleFile)
        moduleJson?.dependencyLists()?.forEach { dependencies ->
          dependencies.removeAll {
            it["group"] == "com.facebook.react" && it["module"] == "react-native"
          }
        }

        moduleJson?.writeJson(moduleFile)
      }
    }

  project.registerTaskAfterMetadataGeneration(removeDependenciesTask, variant)
}

/**
 * Create and register a task to set the version for react-android and hermes-android to match the
 * React Native version of the npm project.
 *
 * @param project The project to set the version for react-android and hermes-android for.
 * @param variant The variant name.
 */
internal fun createSetReactNativeVersionModuleTask(
  project: Project,
  variant: String,
  rnVersion: String,
) {
  val setVersionTask =
    project.tasks.register("setRNDependencyVersionInModuleFile$variant") { task ->
      task.doLast {
        val moduleFile = project.moduleFile(variant)
        if (moduleFile == null) {
          project.logger.warn("WARNING: Module file for project: ${project.name} does not exist")
          project.logger.warn("This file might not need to be modified. Continuing tasks...")
          return@doLast
        }

        val moduleJson = parseModuleJson(moduleFile)
        moduleJson?.dependencies()?.forEach { dependency ->
          if (
            dependency["group"] == "com.facebook.react" &&
              (dependency["module"] == "react-android" || dependency["module"] == "hermes-android")
          ) {
            dependency["version"] = mapOf("requires" to rnVersion)
          }
        }

        moduleJson?.writeJson(moduleFile)
      }
    }

  project.registerTaskAfterMetadataGeneration(setVersionTask, variant)
}
