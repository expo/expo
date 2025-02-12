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
    val libs = versionCatalogs.find("libs")

    with(rootProject) {
      defineDefaultProperties(libs)
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
    versionCatalogs.getVersionOrDefault("ksp", KSPLookup.getValue(extra.get("kotlinVersion") as String))
  }

  project.logger.quiet("""
    ${"[ExpoRootProject]".withColor(Colors.GREEN)} Using the following versions:
      - buildTools:  ${buildTools.withColor(Colors.GREEN)}
      - minSdk:      ${minSdk.withColor(Colors.GREEN)}
      - compileSdk:  ${compileSdk.withColor(Colors.GREEN)}
      - targetSdk:   ${targetSdk.withColor(Colors.GREEN)}
      - ndk:         ${ndk.withColor(Colors.GREEN)}
      - kotlin:      ${kotlin.withColor(Colors.GREEN)}
      - ksp:         ${ksp.withColor(Colors.GREEN)}
  """.trimIndent())
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
