package expo.modules.plugin

import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Exec
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.OutputFile

/**
 * Task that generates a list of packages that should be included in your app's runtime.
 */
abstract class GeneratePackagesListTask : Exec() {
  init {
    group = "expo"
  }

  /**
   * Hash of the current configuration.
   * Used to invalidate the task when the configuration changes.
   */
  @get:Input
  abstract val hash: Property<String>

  /**
   * Serialized autolinking options.
   */
  @get:Input
  abstract val options: Property<String>

  /**
   * Java package name under which the package list should be placed.
   */
  @get:Input
  abstract val namespace: Property<String>

  /**
   * The output file where the package list should be written.
   */
  @get:OutputFile
  abstract val outputFile: RegularFileProperty

  override fun exec() {
    val autolinkingOptions = AutolinkingOptions.fromJson(options.get())
    commandLine(
      AutolinkigCommandBuilder()
        .command("generate-package-list")
        .option("namespace", namespace.get())
        .option("target", outputFile.get().asFile.absolutePath)
        .useAutolinkingOptions(autolinkingOptions)
        .build()
    )
    super.exec()
  }
}
