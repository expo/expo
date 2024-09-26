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
import java.io.File
import java.util.Locale

abstract class ExpoUpdatesPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val reactExtension = project.extensions.findByType(ReactExtension::class.java) ?: run {
      logger.warn("Stop expo-updates resource generation because ReactExtension is not registered")
      return
    }
    val entryFile = detectedEntryFile(reactExtension)
    val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)

    if (System.getenv("EX_UPDATES_NATIVE_DEBUG") == "1") {
      logger.warn("Disable all react.debuggableVariants because EX_UPDATES_NATIVE_DEBUG=1")
      reactExtension.debuggableVariants.set(listOf())
    }

    androidComponents.onVariants(androidComponents.selector().all()) { variant ->
      val targetName = variant.name.replaceFirstChar { if (it.isLowerCase()) it.titlecase(Locale.ROOT) else it.toString() }
      val projectRoot = project.rootProject.projectDir.parentFile.toPath()
      val isDebuggableVariant =
        reactExtension.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }

      val createUpdatesResourcesTask = project.tasks.register("create${targetName}UpdatesResources", CreateUpdatesResourcesTask::class.java) {
        it.description = "expo-updates: Create updates resources for ${targetName}."
        it.projectRoot.set(projectRoot.toString())
        it.nodeExecutableAndArgs.set(reactExtension.nodeExecutableAndArgs.get())
        it.debuggableVariant.set(isDebuggableVariant)
        it.entryFile.set(entryFile.toPath().toString())
      }
      variant.sources.assets?.addGeneratedSourceDirectory(createUpdatesResourcesTask, CreateUpdatesResourcesTask::assetDir)
    }
  }

  abstract class CreateUpdatesResourcesTask : DefaultTask() {
    @get:Input
    abstract val projectRoot: Property<String>

    @get:Input
    abstract val nodeExecutableAndArgs: ListProperty<String>

    @get:Input
    abstract val debuggableVariant: Property<Boolean>

    @get:Input
    abstract val entryFile: Property<String>

    @get:OutputDirectory
    abstract val assetDir: DirectoryProperty

    @TaskAction
    fun exec() {
      assetDir.get().asFile.deleteRecursively()
      assetDir.get().asFile.mkdirs()
      project.exec {
        val args = mutableListOf<String>().apply {
          addAll(nodeExecutableAndArgs.get())
          add("${getExpoUpdatesPackageDir()}/utils/build/createUpdatesResources.js")
          add("android")
          add(projectRoot.get())
          add(assetDir.get().toString())
          add(if (debuggableVariant.get()) "only-fingerprint" else "all")
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

/**
 * Synced implementation from [RNGP](https://github.com/facebook/react-native/blob/9bdd777fd766ff/packages/react-native-gradle-plugin/src/main/kotlin/com/facebook/react/utils/PathUtils.kt#L20-L33)
 */
private fun detectedEntryFile(config: ReactExtension): File {
  val envVariableOverride = System.getenv("ENTRY_FILE") ?: null
  val entryFile = config.entryFile.orNull?.asFile
  val reactRoot = config.root.get().asFile
  return when {
    envVariableOverride != null -> File(reactRoot, envVariableOverride)
    entryFile != null -> entryFile
    File(reactRoot, "index.android.js").exists() -> File(reactRoot, "index.android.js")
    else -> File(reactRoot, "index.js")
  }
}
