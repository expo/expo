package expo.prebuilt

import org.gradle.api.Action
import org.gradle.api.DefaultTask
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.Task
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.ListProperty
import org.gradle.api.provider.MapProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Internal
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.TaskAction
import java.io.File
import java.time.Instant
import java.util.Properties

abstract class PrebuiltNativesExtension {
  abstract val libraries: ListProperty<String>
  abstract val cacheDir: DirectoryProperty
}

abstract class RestoreCachedNativeLibsTask : DefaultTask() {
  @get:Input
  abstract val cxxDirPath: Property<String>

  @get:Input
  abstract val cacheDirPath: Property<String>

  @get:Input
  abstract val cmakeVariantDir: Property<String>

  @TaskAction
  fun execute() {
    val variantDir = File(cxxDirPath.get()).resolve(cmakeVariantDir.get())
    val cacheDir = File(cacheDirPath.get())
    if (!variantDir.exists() || !cacheDir.exists()) return

    var restored = 0
    variantDir.walkTopDown()
      .filter { it.isDirectory && it.name == "obj" }
      .forEach { objDir ->
        for (abiDir in objDir.listFiles()?.filter { it.isDirectory } ?: emptyList()) {
          val cachedAbiDir = File(cacheDir, abiDir.name)
          if (!cachedAbiDir.exists()) continue
          for (so in cachedAbiDir.listFiles()?.filter { it.extension == "so" } ?: emptyList()) {
            so.copyTo(File(abiDir, so.name), overwrite = true)
            restored++
          }
        }
      }
    if (restored > 0) {
      logger.lifecycle("[prebuilt-natives] Restored $restored cached .so files into CMake output")
    }
  }
}

abstract class CacheNativeLibsTask : DefaultTask() {
  @get:Internal
  abstract val cacheBaseDir: DirectoryProperty

  @get:Input
  abstract val libraryProjectDirs: MapProperty<String, String>

  @get:Input
  abstract val variant: Property<String>

  @get:Input
  @get:Optional
  abstract val stripBinaryPath: Property<String>

  @get:Input
  abstract val reactNativeVersion: Property<String>

  @TaskAction
  fun execute() {
    val cacheDir = cacheBaseDir.get().asFile
    val stripBinary = stripBinaryPath.orNull?.let { File(it) }?.takeIf { it.exists() }
    if (stripBinary == null) {
      logger.warn("[prebuilt-natives] NDK strip binary not found, .so files will not be stripped")
    }
    val rnVersion = reactNativeVersion.get()
    for ((libName, projectDirPath) in libraryProjectDirs.get()) {
      cacheLibrary(libName, File(projectDirPath), cacheDir, variant.get(), stripBinary, rnVersion)
    }
  }

  private fun cacheLibrary(
    libName: String,
    projectDir: File,
    cacheBaseDir: File,
    variant: String,
    stripBinary: File?,
    rnVersion: String,
  ) {
    val cacheDir = cacheBaseDir.resolve(libName).resolve(variant)
    cacheDir.mkdirs()

    val variantCap = variant.replaceFirstChar { it.uppercase() }
    val jniCandidates = listOf(
      "build/intermediates/library_and_local_jars_jni/$variant/copy${variantCap}JniLibsProjectAndLocalJars/jni",
      "build/intermediates/library_jni/$variant/copy${variantCap}JniLibsProjectOnly/jni",
    )
    val jniSourceDir = jniCandidates
      .map { File(projectDir, it) }
      .firstOrNull { it.exists() && it.listFiles()?.isNotEmpty() == true }
    if (jniSourceDir == null) {
      logger.warn(
        "[prebuilt-natives] No .so files found for :$libName — " +
          "run assemble$variantCap first or check the build output"
      )
      return
    }

    val jniCacheDir = cacheDir.resolve("jni")
    if (jniCacheDir.exists()) jniCacheDir.deleteRecursively()
    jniSourceDir.copyRecursively(jniCacheDir, overwrite = true)

    val soFiles = jniCacheDir.walkTopDown().filter { it.extension == "so" }.toList()

    if (stripBinary != null) {
      for (so in soFiles) {
        ProcessBuilder(stripBinary.absolutePath, "--strip-all", so.absolutePath)
          .redirectErrorStream(true)
          .start()
          .waitFor()
      }
    }

    val abiDirs = jniCacheDir.listFiles()
      ?.filter { it.isDirectory }
      ?.map { it.name }
      ?: emptyList()

    val version = PrebuiltNativesPlugin.readPackageVersion(projectDir) ?: "unknown"
    val totalSize = soFiles.sumOf { it.length() } / (1024 * 1024)

    cacheDir.resolve("cache-metadata.json").writeText(
      """{
  "libraryVersion": "$version",
  "reactNativeVersion": "$rnVersion",
  "variant": "$variant",
  "abis": [${abiDirs.sorted().joinToString(", ") { "\"$it\"" }}],
  "soFiles": [${soFiles.map { it.name }.distinct().sorted().joinToString(", ") { "\"$it\"" }}],
  "stripped": ${stripBinary != null},
  "cachedAt": "${Instant.now()}"
}"""
    )

    logger.lifecycle(
      "[prebuilt-natives] Cached :$libName v$version ($variant) — " +
        "${soFiles.size} .so files (${abiDirs.sorted().joinToString(", ")}), " +
        "${totalSize}MB total" +
        if (stripBinary != null) " (stripped)" else ""
    )
  }
}

abstract class CleanNativeCacheTask : DefaultTask() {
  @get:Internal
  abstract val cacheBaseDir: DirectoryProperty

  @TaskAction
  fun execute() {
    val dir = cacheBaseDir.get().asFile
    if (dir.exists()) {
      dir.deleteRecursively()
      logger.lifecycle("[prebuilt-natives] Cache removed: ${dir.absolutePath}")
    } else {
      logger.lifecycle("[prebuilt-natives] No cache directory to clean")
    }
  }
}

private data class VariantConfig(
  val name: String,
  val cmakeDir: String,
  val buildTaskPrefix: String,
  val configureTaskPrefix: String,
  val mergeTaskName: String,
)

private val VARIANTS = listOf(
  VariantConfig("debug", "Debug", "buildCMakeDebug", "configureCMakeDebug", "mergeDebugNativeLibs"),
  VariantConfig("release", "RelWithDebInfo", "buildCMakeRelWithDebInfo", "configureCMakeRelWithDebInfo", "mergeReleaseNativeLibs"),
)

class PrebuiltNativesPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    require(project == project.rootProject) {
      "expo-prebuilt-natives must be applied to the root project"
    }

    val extension = project.extensions.create(
      "prebuiltNatives",
      PrebuiltNativesExtension::class.java
    )
    extension.cacheDir.convention(
      project.layout.projectDirectory.dir(".prebuilt-natives-cache")
    )

    val isCachingRun = project.gradle.startParameter.taskNames.any {
      it.contains("cachePrebuiltNatives")
    }

    registerTasks(project, extension)

    if (!isCachingRun) {
      configureSubprojects(project, extension)
    } else {
      project.logger.lifecycle("[prebuilt-natives] Cache mode — all libraries will build from source")
    }
  }

  private fun registerTasks(project: Project, extension: PrebuiltNativesExtension) {
    val stripBinary = findStripBinary(project)
    val rnVersion = readReactNativeVersion(project.rootDir) ?: "unknown"
    val prebuiltOnly = project.providers.gradleProperty("prebuiltOnly")
      .orNull
      ?.split(",")
      ?.map { it.trim() }
      ?.filter { it.isNotEmpty() }

    registerCacheTask(project, extension, "cachePrebuiltNatives", "debug", stripBinary, prebuiltOnly, rnVersion)
    registerCacheTask(project, extension, "cachePrebuiltNativesRelease", "release", stripBinary, prebuiltOnly, rnVersion)

    project.tasks.register("cleanPrebuiltNativesCache", CleanNativeCacheTask::class.java, object : Action<CleanNativeCacheTask> {
      override fun execute(task: CleanNativeCacheTask) {
        task.group = "prebuilt natives"
        task.description = "Delete all cached native library artifacts"
        task.cacheBaseDir.set(extension.cacheDir)
      }
    })
  }

  private fun registerCacheTask(
    project: Project,
    extension: PrebuiltNativesExtension,
    taskName: String,
    variant: String,
    stripBinary: String?,
    prebuiltOnly: List<String>?,
    rnVersion: String,
  ) {
    val variantCap = variant.replaceFirstChar { it.uppercase() }
    project.tasks.register(taskName, CacheNativeLibsTask::class.java, object : Action<CacheNativeLibsTask> {
      override fun execute(task: CacheNativeLibsTask) {
        task.group = "prebuilt natives"
        task.description = "Build native libraries ($variant) from source and cache the .so artifacts"
        task.cacheBaseDir.set(extension.cacheDir)
        task.variant.set(variant)
        task.reactNativeVersion.set(rnVersion)
        if (stripBinary != null) {
          task.stripBinaryPath.set(stripBinary)
        }

        val libs = extension.libraries.orNull ?: return
        val cacheBaseDir = extension.cacheDir.get().asFile
        val projectDirs = mutableMapOf<String, String>()
        for (libName in libs) {
          if (prebuiltOnly != null && libName !in prebuiltOnly) continue
          val libProject = project.findProject(":$libName") ?: continue

          val variantCacheDir = cacheBaseDir.resolve(libName).resolve(variant)
          val metadataFile = variantCacheDir.resolve("cache-metadata.json")
          val jniCacheDir = variantCacheDir.resolve("jni")
          val hasCacheFiles = metadataFile.exists() && jniCacheDir.exists() &&
            jniCacheDir.listFiles()?.isNotEmpty() == true

          if (hasCacheFiles) {
            val packageVersion = readPackageVersion(libProject.projectDir)
            val cachedVersion = readCachedVersion(metadataFile)
            val cachedRnVersion = readCachedField(metadataFile, CACHED_RN_VERSION_REGEX)
            val versionMatch = packageVersion == null || cachedVersion == null || packageVersion == cachedVersion
            val rnMatch = cachedRnVersion == null || cachedRnVersion == rnVersion
            if (versionMatch && rnMatch) {
              project.logger.lifecycle(
                "[prebuilt-natives] Cache up-to-date for :$libName ($variant)" +
                  if (cachedVersion != null) " v$cachedVersion, skipping" else ", skipping"
              )
              continue
            }
            val reasons = mutableListOf<String>()
            if (!versionMatch) reasons.add("lib=$cachedVersion→$packageVersion")
            if (!rnMatch) reasons.add("RN=$cachedRnVersion→$rnVersion")
            project.logger.lifecycle(
              "[prebuilt-natives] Cache stale for :$libName ($variant) " +
                "(${reasons.joinToString(", ")}), rebuilding"
            )
          } else {
            project.logger.lifecycle("[prebuilt-natives] No $variant cache for :$libName, building")
          }

          task.dependsOn(":$libName:assemble$variantCap")
          projectDirs[libName] = libProject.projectDir.absolutePath
        }
        task.libraryProjectDirs.set(projectDirs)
      }
    })
  }

  private fun configureSubprojects(rootProject: Project, extension: PrebuiltNativesExtension) {
    rootProject.gradle.afterProject(object : Action<Project> {
      override fun execute(subproject: Project) {
        if (subproject == rootProject) return
        if (subproject.state.failure != null) return
        val libs = extension.libraries.orNull ?: return
        if (subproject.name in libs) {
          applyPrebuiltIfCached(subproject, extension)
        }
      }
    })
  }

  private fun applyPrebuiltIfCached(project: Project, extension: PrebuiltNativesExtension) {
    val libCacheDir = extension.cacheDir.get().asFile.resolve(project.name)

    migrateLegacyCache(project, libCacheDir)

    val rnVersion = readReactNativeVersion(project.rootProject.rootDir)
    val cxxDirPath = project.file("build/intermediates/cxx").absolutePath
    var anyVariantCached = false

    for (vc in VARIANTS) {
      val variantCacheDir = libCacheDir.resolve(vc.name)
      val metadataFile = variantCacheDir.resolve("cache-metadata.json")

      if (!metadataFile.exists()) continue

      val packageVersion = readPackageVersion(project.projectDir)
      val cachedVersion = readCachedVersion(metadataFile)
      if (packageVersion != null && cachedVersion != null && packageVersion != cachedVersion) {
        project.logger.warn(
          "[prebuilt-natives] Cache stale for :${project.name} (${vc.name}) " +
            "(lib cached=$cachedVersion, installed=$packageVersion) — building from source"
        )
        continue
      }

      val cachedRnVersion = readCachedField(metadataFile, CACHED_RN_VERSION_REGEX)
      if (rnVersion != null && cachedRnVersion != null && rnVersion != cachedRnVersion) {
        project.logger.warn(
          "[prebuilt-natives] Cache stale for :${project.name} (${vc.name}) " +
            "(RN cached=$cachedRnVersion, installed=$rnVersion) — building from source"
        )
        continue
      }

      val jniCacheDir = variantCacheDir.resolve("jni")
      if (!jniCacheDir.exists() || jniCacheDir.listFiles()?.isEmpty() != false) continue

      project.logger.lifecycle(
        "[prebuilt-natives] Using cached native libs for :${project.name} (${vc.name}, $cachedVersion)"
      )
      anyVariantCached = true

      project.tasks.matching { it.name.startsWith(vc.buildTaskPrefix) }
        .configureEach(object : Action<Task> {
          override fun execute(task: Task) {
            task.enabled = false
          }
        })

      val restoreTaskName = "restoreCachedNativeLibs${vc.name.replaceFirstChar { it.uppercase() }}"
      val restoreTask = project.tasks.register(
        restoreTaskName,
        RestoreCachedNativeLibsTask::class.java,
        object : Action<RestoreCachedNativeLibsTask> {
          override fun execute(task: RestoreCachedNativeLibsTask) {
            task.cxxDirPath.set(cxxDirPath)
            task.cacheDirPath.set(jniCacheDir.absolutePath)
            task.cmakeVariantDir.set(vc.cmakeDir)
            task.mustRunAfter(project.tasks.matching { it.name.startsWith(vc.configureTaskPrefix) })
          }
        }
      )

      project.tasks.matching { it.name == vc.mergeTaskName }
        .configureEach(object : Action<Task> {
          override fun execute(task: Task) {
            task.dependsOn(restoreTask)
          }
        })
    }

    if (!anyVariantCached) {
      project.logger.lifecycle(
        "[prebuilt-natives] No cache for :${project.name}, building from source"
      )
      return
    }

    project.tasks.matching { it.name.startsWith("externalNativeBuild") }
      .configureEach(object : Action<Task> {
        override fun execute(task: Task) {
          val variant = if (task.name.lowercase().contains("release")) "Release" else "Debug"
          val restoreName = "restoreCachedNativeLibs$variant"
          val restoreTask = project.tasks.findByName(restoreName)
          if (restoreTask != null) {
            task.dependsOn(restoreTask)
          }
        }
      })
  }

  private fun migrateLegacyCache(project: Project, libCacheDir: File) {
    val legacyMetadata = libCacheDir.resolve("cache-metadata.json")
    if (!legacyMetadata.exists()) return

    val debugDir = libCacheDir.resolve("debug")
    debugDir.mkdirs()
    val legacyJni = libCacheDir.resolve("jni")
    if (legacyJni.exists()) {
      legacyJni.renameTo(debugDir.resolve("jni"))
    }
    legacyMetadata.renameTo(debugDir.resolve("cache-metadata.json"))
    project.logger.lifecycle(
      "[prebuilt-natives] Migrated :${project.name} cache to variant-based structure"
    )
  }

  companion object {
    private val VERSION_REGEX = Regex(""""version"\s*:\s*"([^"]+)"""")
    private val CACHED_VERSION_REGEX = Regex(""""libraryVersion"\s*:\s*"([^"]+)"""")
    private val CACHED_RN_VERSION_REGEX = Regex(""""reactNativeVersion"\s*:\s*"([^"]+)"""")

    fun readPackageVersion(projectDir: File): String? {
      val packageJson = projectDir.resolve("../package.json")
      if (!packageJson.exists()) return null
      return VERSION_REGEX.find(packageJson.readText())?.groupValues?.get(1)
    }

    fun readCachedVersion(metadataFile: File): String? {
      return readCachedField(metadataFile, CACHED_VERSION_REGEX)
    }

    fun readCachedField(metadataFile: File, regex: Regex): String? {
      if (!metadataFile.exists()) return null
      return regex.find(metadataFile.readText())?.groupValues?.get(1)
    }

    fun readReactNativeVersion(rootDir: File): String? {
      var dir: File? = rootDir
      while (dir != null) {
        val packageJson = dir.resolve("node_modules/react-native/package.json")
        if (packageJson.exists()) {
          return VERSION_REGEX.find(packageJson.readText())?.groupValues?.get(1)
        }
        dir = dir.parentFile
      }
      return null
    }

    private fun findStripBinary(project: Project): String? {
      val sdkDir = findAndroidSdkDir(project) ?: return null
      val ndkDir = File(sdkDir, "ndk").listFiles()
        ?.filter { it.isDirectory && !it.name.startsWith(".") }
        ?.maxByOrNull { it.name }
        ?: return null

      val osName = System.getProperty("os.name").lowercase()
      val hostTag = when {
        osName.contains("mac") -> "darwin-x86_64"
        osName.contains("linux") -> "linux-x86_64"
        else -> "windows-x86_64"
      }

      val strip = ndkDir.resolve("toolchains/llvm/prebuilt/$hostTag/bin/llvm-strip")
      return if (strip.exists()) strip.absolutePath else null
    }

    private fun findAndroidSdkDir(project: Project): String? {
      val localProps = project.rootDir.resolve("local.properties")
      if (localProps.exists()) {
        val props = Properties()
        localProps.inputStream().use { props.load(it) }
        props.getProperty("sdk.dir")?.let { return it }
      }
      System.getenv("ANDROID_HOME")?.let { return it }
      System.getenv("ANDROID_SDK_ROOT")?.let { return it }
      return null
    }
  }
}
