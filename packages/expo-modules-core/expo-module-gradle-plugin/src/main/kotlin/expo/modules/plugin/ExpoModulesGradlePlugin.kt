// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import com.android.build.api.variant.AndroidComponentsExtension
import expo.modules.plugin.gradle.ExpoGradleHelperExtension
import expo.modules.plugin.gradle.ExpoModuleExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.internal.extensions.core.extra

private val lock = Any()

abstract class ExpoModulesGradlePlugin : Plugin<Project> {
  override fun apply(project: Project) {
    val kotlinVersion = getKotlinVersion(project)
    val kspVersion = getKSPVersion(project)

    // Creates a user-facing extension that provides access to the `ExpoGradleHelperExtension`.
    val expoModuleExtension = project.extensions.create("expoModule", ExpoModuleExtension::class.java, project)

    with(project) {
      applyDefaultPlugins()
      applyKotlin(kotlinVersion, kspVersion)
      applyDefaultDependencies()
      applyDefaultAndroidSdkVersions()

      extensions.getByType(AndroidComponentsExtension::class.java).finalizeDsl {
        applyPublishing(expoModuleExtension)
      }
    }

    // Adds the expoGradleHelper extension to the gradle instance if it doesn't exist.
    // If it does exist, that means it was added by a different project.
    synchronized(lock) {
      with(project.gradle.extensions) {
        if (findByType(ExpoGradleHelperExtension::class.java) == null) {
          create("expoGradleHelper", ExpoGradleHelperExtension::class.java)
        }
      }
    }
  }

  private fun getKotlinVersion(project: Project): String {
    return project.rootProject.extra.safeGet<String>("kotlinVersion")
      ?: project.logger.warnIfNotDefined("kotlinVersion", "2.0.21")
  }

  private fun getKSPVersion(project: Project): String {
    return project.rootProject.extra.safeGet<String>("kspVersion")
      ?: project.logger.warnIfNotDefined("kspVersion", "2.0.21-1.0.28")
  }
}
