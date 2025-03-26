package expo.modules.plugin

import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.gradle.internal.tasks.factory.dependsOn
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.withColor
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.Directory
import org.gradle.api.file.RegularFile
import org.gradle.api.provider.Provider
import org.gradle.api.tasks.TaskProvider
import java.nio.file.Paths

const val generatedPackageListNamespace = "expo.modules"
const val generatedPackageListFilename = "ExpoModulesPackageList.java"
const val generatedFilesSrcDir = "generated/expo/src/main/java"

open class ExpoAutolinkingPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val gradleExtension = project.gradle.extensions.findByType(ExpoGradleExtension::class.java)
      ?: throw IllegalStateException("`ExpoGradleExtension` not found. Please, make sure that `useExpoModules` was called in `settings.gradle`.")
    val config = gradleExtension.config

    project.logger.quiet("")
    project.logger.quiet("Using expo modules")

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

    // Creates a task that generates a list of expo modules.
    val generatePackagesList = createGeneratePackagesListTask(project, gradleExtension.options, gradleExtension.hash)

    // Ensures that the task is executed before the build.
    project.tasks
      .named("preBuild", Task::class.java)
      .dependsOn(generatePackagesList)

    // Adds the generated file to the source set.
    project.extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl { ext ->
      ext
        .sourceSets
        .getByName("main")
        .java
        .srcDir(getPackageListDir(project))
    }
  }

  fun getPackageListDir(project: Project): Provider<Directory> {
    return project.layout.buildDirectory.dir(generatedFilesSrcDir)
  }

  fun getPackageListFile(project: Project): Provider<RegularFile> {
    val packageListRelativePath = Paths.get(
      generatedFilesSrcDir,
      generatedPackageListNamespace.replace('.', '/'),
      generatedPackageListFilename
    ).toString()
    return project.layout.buildDirectory.file(packageListRelativePath)
  }

  fun createGeneratePackagesListTask(project: Project, options: AutolinkingOptions, hash: String): TaskProvider<GeneratePackagesListTask> {
    return project.tasks.register("generatePackagesList", GeneratePackagesListTask::class.java) {
      it.hash.set(hash)
      it.namespace.set(generatedPackageListNamespace)
      it.outputFile.set(getPackageListFile(project))
      it.workingDir = project.rootDir
      // Serializes the autolinking options to JSON to pass them to the task.
      // The types supported as a task input are limited to primitives, strings, and files.
      it.options.set(options.toJson())
    }
  }
}
