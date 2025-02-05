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
      ?: throw IllegalStateException("`compileSdkVersion` isn't defined.")
    defaultConfig {
      minSdk = rootProject.extra.safeGet("minSdkVersion")
        ?: throw IllegalStateException("`minSdkVersion` isn't defined.")
      targetSdk = rootProject.extra.safeGet("targetSdkVersion")
        ?: throw IllegalStateException("`targetSdkVersion` isn't defined.")
    }

    lintOptions.isAbortOnError = false
  }
}
