package expo.modules.updates

import com.android.build.api.variant.AndroidComponentsExtension
import com.facebook.react.ReactExtension
import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction
import org.slf4j.LoggerFactory
import java.io.ByteArrayOutputStream
import java.util.Locale

abstract class ExpoUpdatesPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val reactExtension = project.extensions.findByType(ReactExtension::class.java) ?: run {
      logger.warn("Stop expo-updates app.manifest generation because ReactExtension is not registered")
      return
    }
    val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)

    if (System.getenv("EX_UPDATES_NATIVE_DEBUG") == "1") {
      logger.warn("Disable all react.debuggableVariants because EX_UPDATES_NATIVE_DEBUG=1")
      reactExtension.debuggableVariants.set(listOf())
    }

    androidComponents.onVariants(androidComponents.selector().all()) { variant ->
      val targetName = variant.name.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() }
      val projectRoot = project.rootProject.projectDir.parentFile.toPath()
      val entryFile = projectRoot.relativize(reactExtension.entryFile.get().asFile.toPath())
      val isDebuggableVariant =
        reactExtension.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }

      val createManifestTask = project.tasks.register("create${targetName}ExpoManifest", CreateManifestTask::class.java) {
        it.description = "expo-updates: Create manifest for ${targetName}."
        it.projectRoot.set(projectRoot.toString())
        it.entryFile.set(entryFile.toString())
        it.nodeExecutableAndArgs.set(reactExtension.nodeExecutableAndArgs.get())
        it.enabled = !isDebuggableVariant
      }
      variant.sources.assets?.addGeneratedSourceDirectory(createManifestTask, CreateManifestTask::assetDir)
    }
  }

  abstract class CreateManifestTask : DefaultTask() {
    @get:Input
    abstract val projectRoot: Property<String>

    @get:Input
    abstract val entryFile: Property<String>

    @get:Input
    abstract val nodeExecutableAndArgs: ListProperty<String>

    @get:OutputDirectory
    abstract val assetDir: DirectoryProperty

    @TaskAction
    fun exec() {
      assetDir.get().asFile.deleteRecursively()
      assetDir.get().asFile.mkdirs()
      project.exec {
        val args = mutableListOf<String>().apply {
          addAll(nodeExecutableAndArgs.get())
          add("${getExpoUpdatesPackageDir()}/scripts/createManifest.js")
          add("android")
          add(projectRoot.get())
          add(assetDir.get().toString())
          add(entryFile.get())
        }

        if (Os.isFamily(Os.FAMILY_WINDOWS)) {
          it.commandLine("cmd", "/c", *args.toTypedArray())
        } else {
          it.commandLine(args)
        }

        it.workingDir(projectRoot)
      }
    }

    private fun getExpoUpdatesPackageDir(): String {
      val stdoutBuffer = ByteArrayOutputStream()
      project.exec {
        val args = listOf(*nodeExecutableAndArgs.get().toTypedArray(), "-e", "console.log(require('path').dirname(require.resolve('expo-updates/package.json')));")
        if (Os.isFamily(Os.FAMILY_WINDOWS)) {
          it.commandLine("cmd", "/c", *args.toTypedArray())
        } else {
          it.commandLine(args)
        }
        it.workingDir(projectRoot.get())
        it.standardOutput = stdoutBuffer
      }
      return String(stdoutBuffer.toByteArray()).trim()
    }
  }

  companion object {
    internal val logger by lazy {
      LoggerFactory.getLogger(ExpoUpdatesPlugin::class.java)
    }
  }
}
