package expo.modules.plugin

import com.android.build.api.dsl.CommonExtension
import expo.modules.plugin.text.Colors
import expo.modules.plugin.text.withColor
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.artifacts.VersionCatalog
import org.gradle.api.artifacts.VersionCatalogsExtension
import org.gradle.api.plugins.ExtraPropertiesExtension
import org.gradle.internal.extensions.core.extra
import java.util.Optional
import kotlin.jvm.optionals.getOrNull

class ExpoRootProjectPlugin : Plugin<Project> {
  override fun apply(rootProject: Project) {
    val versionCatalogs = rootProject.extensions.getByType(VersionCatalogsExtension::class.java)
    val libs = versionCatalogs.find("expoLibs")

    with(rootProject) {
      defineDefaultProperties(libs)
      maybeOverrideCmakeVersion()
      setDefaultCmakeObjectPathMax()
      disableLinkedModulesLintWhenRequested()
    }
  }
}

/**
 * Maybe override the `android.externalNativeBuild.cmake.version` for all subprojects. Set via
 * `android.cmakeVersion` in **gradle.properties**.
 */
private fun Project.maybeOverrideCmakeVersion() {
  val cmakeVersion = (findProperty("android.cmakeVersion") as? String)?.takeIf { it.isNotBlank() }
    ?: return

  logger.quiet(
    "${"[ExpoRootProject]".withColor(Colors.GREEN)} Overriding CMake version: ${cmakeVersion.withColor(Colors.GREEN)}"
  )

  val applyCmakeVersion = { subproject: Project ->
    val android = subproject.extensions.getByType(CommonExtension::class.java)
    android.externalNativeBuild.cmake.version = cmakeVersion
  }

  subprojects { subproject ->
    subproject.plugins.withId("com.android.application") { applyCmakeVersion(subproject) }
    subproject.plugins.withId("com.android.library") { applyCmakeVersion(subproject) }
  }
}

/**
 * Raises the maximum object file path length CMake allows before it warns and eventually fails
 * the build. CMake's default is 250 characters on Windows and 1000 elsewhere, and deeply nested
 * project structures (a home folder plus `node_modules`, or a pnpm virtual store) commonly
 * exceed the Windows limit. 1024 is the safe maximum on macOS; Windows needs long paths support,
 * which is commonly enabled, and Linux typically allows 4096.
 *
 * The limit is CMake's generate-time prediction of the longest object file path the tools it
 * generates build files for (Ninja, the compiler, the archiver) can handle. CMake can't know
 * their real limits, so it uses a hardcoded conservative guess and fails preemptively, even
 * when those tools support longer paths. Raising it removes only that guess; when the tools
 * genuinely can't handle long paths on Windows (AGP's default CMake 3.22.1 bundles a version
 * of Ninja without long-path support), the `android.cmakeVersion` property read by
 * [maybeOverrideCmakeVersion] selects a newer CMake whose Ninja handles long paths.
 *
 * Setting the value here, on the root project, applies it to every module that builds native
 * code with CMake, so individual libraries don't need to set it themselves. A library that
 * passes its own `-DCMAKE_OBJECT_PATH_MAX` still wins: its argument comes later on the CMake
 * command line.
 *
 * The `expo.android.cmakeObjectPathMax` Gradle property controls the value: when the property
 * is unset or empty, the default of 1024 applies; `0` opts out and keeps CMake's platform
 * defaults; any other value must be an integer greater than or equal to 128, CMake's minimum.
 */
internal fun Project.setDefaultCmakeObjectPathMax() {
  val objectPathMax = cmakeObjectPathMax() ?: return

  allprojects { project ->
    // "com.android.base" is applied by both the Android application and library plugins
    project.pluginManager.withPlugin("com.android.base") {
      project.extensions.findByType(CommonExtension::class.java)
        ?.defaultConfig
        ?.externalNativeBuild
        ?.cmake
        ?.arguments
        ?.add("-DCMAKE_OBJECT_PATH_MAX=$objectPathMax")
    }
  }
}

/**
 * Reads and validates the `expo.android.cmakeObjectPathMax` Gradle property. Returns null when
 * the property is set to `0`, which opts out of setting `CMAKE_OBJECT_PATH_MAX` entirely.
 */
internal fun Project.cmakeObjectPathMax(): Int? {
  val rawValue = (findProperty(CMAKE_OBJECT_PATH_MAX_PROPERTY) as? String)?.trim()
  if (rawValue.isNullOrEmpty()) {
    return DEFAULT_CMAKE_OBJECT_PATH_MAX
  }

  val value = rawValue.toIntOrNull()
  if (value == 0) {
    return null
  }
  if (value == null || value < 128) {
    logger.warn(
      "The \"$CMAKE_OBJECT_PATH_MAX_PROPERTY\" Gradle property is set to \"$rawValue\", which is not a valid value for CMAKE_OBJECT_PATH_MAX " +
        "because CMake requires an integer greater than or equal to 128. Using a recommended value of $DEFAULT_CMAKE_OBJECT_PATH_MAX instead. " +
        "Set the property to an integer greater than or equal to 128, remove it to use $DEFAULT_CMAKE_OBJECT_PATH_MAX (recommended), or set it to 0 to keep CMake's defaults."
    )
    return DEFAULT_CMAKE_OBJECT_PATH_MAX
  }
  return value
}

private const val CMAKE_OBJECT_PATH_MAX_PROPERTY = "expo.android.cmakeObjectPathMax"
private const val DEFAULT_CMAKE_OBJECT_PATH_MAX = 1024

/**
 * Determines whether autolinked native modules should be linted when building the release version
 * of the app.
 */
internal fun Project.isLinkedModuleLintEnabled(): Boolean {
  (findProperty("expo.android.enableLint") as? String)?.let { return it.toBoolean() }
  System.getenv("EXPO_ANDROID_ENABLE_LINT")?.let { return it.toBoolean() }
  return false
}

/**
 * Centrally skips the expensive lint-vital *analysis* for autolinked native modules when
 * module linting is disabled (see [isLinkedModuleLintEnabled]).
 *
 * A module's lint-vital analysis is skipped when either is true:
 *  - Its sources live under `node_modules` (third-party React Native libraries).
 *  - It is an Expo module
 *
 * The app itself is left untouched - its lint-vital still runs.
 *
 * Only `lintVitalAnalyze*` is disabled - that's the task that actually runs the lint
 * detectors. The cheap `generate*LintVitalModel` task is left enabled on purpose: the
 * app's `lintVitalReportRelease` requires every dependency's vital model and fails with
 * "Lint model ... does not exist" if it's missing. Keeping the model while skipping the
 * analysis lets the app build skip the work without breaking the report.
 */
internal fun Project.disableLinkedModulesLintWhenRequested() {
  if (isLinkedModuleLintEnabled()) {
    return
  }

  subprojects { subproject ->
    // Third-party native modules autolinked from node_modules.
    if (subproject.projectDir.invariantSeparatorsPath.contains("/node_modules/")) {
      subproject.disableLintVitalAnalysis()
    }
    // Every Expo module, wherever its sources live.
    subproject.plugins.withId("expo-module-gradle-plugin") {
      subproject.disableLintVitalAnalysis()
    }
  }
}

private fun Project.disableLintVitalAnalysis() {
  tasks.configureEach { task ->
    if (task.name.startsWith("lintVitalAnalyze")) {
      task.enabled = false
    }
  }
}

fun Project.defineDefaultProperties(versionCatalogs: Optional<VersionCatalog>) {
  // Android related
  val buildTools = extra.setIfNotExist("buildToolsVersion") { versionCatalogs.getVersionOrDefault("buildTools", "35.0.0") }
  val minSdk = extra.setIfNotExist("minSdkVersion") { Integer.parseInt(versionCatalogs.getVersionOrDefault("minSdk", "24")) }
  val compileSdk = extra.setIfNotExist("compileSdkVersion") { Integer.parseInt(versionCatalogs.getVersionOrDefault("compileSdk", "35")) }
  val targetSdk = extra.setIfNotExist("targetSdkVersion") { Integer.parseInt(versionCatalogs.getVersionOrDefault("targetSdk", "35")) }
  val ndk = extra.setIfNotExist("ndkVersion") { versionCatalogs.getVersionOrDefault("ndkVersion", "27.1.12297006") }

  // Kotlin related
  val kotlin = extra.setIfNotExist("kotlinVersion") { versionCatalogs.getVersionOrDefault("kotlin", "2.0.21") }
  val ksp = extra.setIfNotExist("kspVersion") {
    versionCatalogs.getVersionOrDefault("ksp") {
      val kotlinVersion = extra.get("kotlinVersion") as String

      KSPLookup[kotlinVersion]?.let { return@getVersionOrDefault it }
      if (kotlinVersion >= "2.3.0") {
        return@getVersionOrDefault latestKspVersion
      }

      val minSupported = KSPLookup.keys.min()
      throw IllegalStateException(
        """
        Kotlin $kotlinVersion is not supported by Expo modules.
        The minimum supported Kotlin version is $minSupported. 
        Update 'kotlinVersion' in your project's build.gradle to a supported version. 
        Alternatively, you can set 'kspVersion' explicitly in build.gradle to bypass this check, but this is unsupported and may cause build failures.  
        """.trimIndent()
      )
    }
  }

  project.logger.quiet(
    """
    ${"[ExpoRootProject]".withColor(Colors.GREEN)} Using the following versions:
      - buildTools:  ${buildTools.withColor(Colors.GREEN)}
      - minSdk:      ${minSdk.withColor(Colors.GREEN)}
      - compileSdk:  ${compileSdk.withColor(Colors.GREEN)}
      - targetSdk:   ${targetSdk.withColor(Colors.GREEN)}
      - ndk:         ${ndk.withColor(Colors.GREEN)}
      - kotlin:      ${kotlin.withColor(Colors.GREEN)}
      - ksp:         ${ksp.withColor(Colors.GREEN)}
  """.trimIndent()
  )
}

inline fun ExtraPropertiesExtension.setIfNotExist(name: String, value: () -> Any): Any? {
  if (!has(name)) {
    set(name, value())
  }

  return get(name)
}

fun Optional<VersionCatalog>.getVersionOrDefault(name: String, default: String): String {
  return getOrNull()?.findVersion(name)?.getOrNull()?.requiredVersion ?: default
}

fun Optional<VersionCatalog>.getVersionOrDefault(name: String, default: () -> String): String {
  return getOrNull()?.findVersion(name)?.getOrNull()?.requiredVersion ?: default.invoke()
}
