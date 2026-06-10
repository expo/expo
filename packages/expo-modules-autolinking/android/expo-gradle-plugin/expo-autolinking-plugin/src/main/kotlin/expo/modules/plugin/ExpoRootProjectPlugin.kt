package expo.modules.plugin

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
      disableLinkedModulesLintWhenRequested()
    }
  }
}

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
