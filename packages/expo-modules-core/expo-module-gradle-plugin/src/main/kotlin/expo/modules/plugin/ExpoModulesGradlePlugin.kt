// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.internal.extensions.core.extra

private const val defaultKotlinVersion = "1.9.24"
private const val defaultKSPVersion = "1.9.24-1.0.20"


abstract class ExpoModulesGradlePlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val kotlinVersion = getKotlinVersion(project)
    val kspVersion = getKSPVersion(project, kotlinVersion)

    with(project) {
      applyDefaultPlugins()
      applyKotlin(kotlinVersion, kspVersion)
      applyDefaultDependencies()
      applyDefaultAndroidSdkVersions()
    }
  }

  private fun getKotlinVersion(project: Project): String {
    return project.extra.safeGet<String>("kotlinVersion") ?: defaultKotlinVersion
  }

  private fun getKSPVersion(project: Project, kotlinVersion: String): String {
    return project.extra.safeGet<String>("kspVersion")
      ?: getKSPVersionForKotlin(kotlinVersion)
  }

  private fun getKSPVersionForKotlin(kotlinVersion: String): String {
    return when (kotlinVersion) {
      "1.6.10" -> "1.6.10-1.0.4"
      "1.6.21" -> "1.6.21-1.0.6"
      "1.7.22" -> "1.7.22-1.0.8"
      "1.8.0" -> "1.8.0-1.0.9"
      "1.8.10" -> "1.8.10-1.0.9"
      "1.8.22" -> "1.8.22-1.0.11"
      "1.9.23" -> "1.9.23-1.0.20"
      "1.9.24" -> "1.9.24-1.0.20"
      "2.0.21" -> "2.0.21-1.0.28"
      else -> defaultKSPVersion
    }
  }
}
