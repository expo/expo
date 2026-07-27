package expo.modules.plugin

import org.gradle.api.DefaultTask
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction
import org.gradle.process.ExecOperations
import javax.inject.Inject

/**
 * Task that mirrors the Kotlin inline modules and generates the `ExpoInlineModulesList` provider.
 */
abstract class GenerateInlineModulesTask : DefaultTask() {
  init {
    group = "expo"
    // Inline modules can change between builds, so always regenerate.
    outputs.upToDateWhen { false }
  }

  /**
   * Working directory used to resolve the `expo-modules-autolinking` node command (the root project).
   */
  @get:Internal
  abstract val nodeWorkingDir: DirectoryProperty

  /**
   * Directory the inline Kotlin module files are mirrored into. This lives under `src` (a regular
   * source directory that is compiled without any extra registration), so it is not a tracked
   * output of this task.
   */
  @get:Internal
  abstract val mirrorDirectory: DirectoryProperty

  /**
   * Serialized list of the directories watched for inline modules.
   */
  @get:Input
  abstract val watchedDirectoriesSerialized: Property<String>

  /**
   * Output directory (a generated source root) where `ExpoInlineModulesList.kt` is written. Only
   * this directory is wired with `addGeneratedSourceDirectory`.
   */
  @get:OutputDirectory
  abstract val outputDirectory: DirectoryProperty

  @get:Inject
  abstract val execOperations: ExecOperations

  @TaskAction
  fun generateInlineModules() {
    execOperations.exec { spec ->
      spec.workingDir(nodeWorkingDir.get().asFile)
      spec.commandLine(
        "node",
        "--no-warnings",
        "--eval",
        "require('expo/bin/autolinking')",
        "expo-modules-autolinking",
        "mirror-kotlin-inline-modules",
        "--kotlin-files-mirror-directory",
        mirrorDirectory.get().asFile.absolutePath,
        "--inline-modules-list-directory",
        outputDirectory.get().asFile.absolutePath,
        "--watched-directories-serialized",
        watchedDirectoriesSerialized.get()
      )
    }
  }
}
