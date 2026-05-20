package expo.modules.plugin

import expo.modules.plugin.configuration.ExpoModule
import org.gradle.api.DefaultTask
import org.gradle.api.file.RegularFileProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.OutputFile
import org.gradle.api.tasks.TaskAction

/**
 * Task that generates a list of packages that should be included in your app's runtime.
 */
abstract class GeneratePackagesListTask : DefaultTask() {
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
   * Java package name under which the package list should be placed.
   */
  @get:Input
  abstract val namespace: Property<String>

  /**
   * List of modules.
   */

  @get:Internal
  lateinit var modules: List<ExpoModule>

  /**
   * The output file where the package list should be written.
   */
  @get:OutputFile
  abstract val outputFile: RegularFileProperty

  @TaskAction
  fun generatePackagesList() {
    val target = outputFile.get().asFile
    val content = generatePackageListFileContent()

    target.writeText(content)
  }

  private fun generatePackageListFileContent(): String {
    return """package ${namespace.get()};

import expo.modules.core.interfaces.Package;
import expo.modules.kotlin.modules.Module;
import expo.modules.kotlin.ModulesProvider;

class ExpoModulesPackageList : ModulesProvider {
  companion object {
    val packagesList: List<Package> = listOf(
    ${
      modules
        .filterNot { it.packageName == "expo" }
        .flatMap { module ->
          module.projects.flatMap { project ->
            project.packages.map { "      ${it}()" }
          }
        }
        .joinToString(",\n")
    }
    )

    val modulesMap: Map<Class<out Module>, String?> = mapOf(
    ${
      modules
        .flatMap { module ->
          module.projects.flatMap { project ->
            project.modules.map { (classifier, name) ->
              "      ${classifier}::class.java to ${name?.let { "\"${it}\"" }}"
            }
          }
        }
        .joinToString(",\n")
    } 
    )

    @JvmStatic
    fun getPackageList(): List<Package> {
      return packagesList
    }
  }

  override fun getModulesMap(): Map<Class<out Module>, String?> {
    return modulesMap
  }
  
  override fun getServices(): List<Class<out expo.modules.kotlin.services.Service>> {
    return listOf<Class<out expo.modules.kotlin.services.Service>>(
    ${
      modules
        .flatMap { module ->
          module.projects.flatMap { project ->
            project.services.map { "      ${it}::class.java" }
          }
        }
        .joinToString(",\n")
    }
    )
  }
}

""".trimIndent()
  }
}
