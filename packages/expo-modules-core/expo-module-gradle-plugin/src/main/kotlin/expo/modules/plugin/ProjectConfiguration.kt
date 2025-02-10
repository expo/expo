// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import com.android.build.gradle.LibraryExtension
import org.gradle.api.Project
import org.gradle.internal.extensions.core.extra

internal fun Project.applyDefaultPlugins() {
  if (!plugins.hasPlugin("com.android.library")) {
    plugins.apply("com.android.library")
  }
  if (!plugins.hasPlugin("kotlin-android")) {
    plugins.apply("kotlin-android")
  }
}

internal fun Project.applyKotlin(kotlinVersion: String, kspVersion: String) {
  extra.set("kotlinVersion", kotlinVersion)
  extra.set("kspVersion", kspVersion)

  project.dependencies.add("implementation", "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlinVersion")
}

internal fun Project.applyDefaultDependencies() {
  val modulesCore = project.project(":expo-modules-core")
  if (project != modulesCore) {
    project.dependencies.add("implementation", project.project(":expo-modules-core"))
  }
}

internal fun Project.applyDefaultAndroidSdkVersions() {
  extensions.getByType(LibraryExtension::class.java).apply {
    compileSdk = rootProject.extra.safeGet("compileSdkVersion")
      ?: logger.warnIfNotDefined("compileSdkVersion", 35)
    defaultConfig {
      minSdk = rootProject.extra.safeGet("minSdkVersion")
        ?: logger.warnIfNotDefined("minSdkVersion", 24)
      targetSdk = rootProject.extra.safeGet("targetSdkVersion")
        ?: logger.warnIfNotDefined("targetSdkVersion", 34)
    }

    lintOptions.isAbortOnError = false
  }
}
