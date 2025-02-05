package expo.modules.plugin

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
  extra.setIfNotExist("buildToolsVersion") { versionCatalogs.getVersionOrDefault("buildTools", "35.0.0") }
  extra.setIfNotExist("minSdkVersion") { Integer.parseInt(versionCatalogs.getVersionOrDefault("minSdk", "24")) }
  extra.setIfNotExist("compileSdkVersion") { Integer.parseInt(versionCatalogs.getVersionOrDefault("compileSdk", "35")) }
  extra.setIfNotExist("targetSdkVersion") { Integer.parseInt(versionCatalogs.getVersionOrDefault("targetSdk", "35")) }
  extra.setIfNotExist("ndkVersion") { versionCatalogs.getVersionOrDefault("ndkVersion", "27.1.12297006") }

  // Kotlin related
  extra.setIfNotExist("kotlinVersion") { versionCatalogs.getVersionOrDefault("kotlin", "2.0.21") }
  extra.setIfNotExist("kspVersion") { versionCatalogs.getVersionOrDefault("ksp", "2.0.21-1.0.28") }
}

inline fun ExtraPropertiesExtension.setIfNotExist(name: String, value: () -> Any) {
  if (!has(name)) {
    set(name, value())
  }
}

fun Optional<VersionCatalog>.getVersionOrDefault(name: String, default: String): String {
  return getOrNull()?.findVersion(name)?.getOrNull()?.requiredVersion ?: default
}
