// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin

import com.android.build.gradle.LibraryExtension
import org.gradle.api.Project
import org.gradle.internal.extensions.core.extra

private const val defaultCompileSdkVersion = 34
private const val defaultMinSdkVersion = 23
private const val defaultTargetSdkVersion = 34

internal fun Project.applyDefaultPlugins() {
  plugins.apply("com.android.library")
  plugins.apply("kotlin-android")
}

internal fun Project.applyKotlin(kotlinVersion: String, kspVersion: String) {
  extra.set("kotlinVersion", kotlinVersion)
  extra.set("kspVersion", kspVersion)

  project.dependencies.add("implementation", "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlinVersion")
}

internal fun Project.applyDefaultDependencies() {
  project.dependencies.add("implementation", project.project(":expo-modules-core"))
}

internal fun Project.applyDefaultAndroidSdkVersions() {
  extensions.getByType(LibraryExtension::class.java).apply {
    compileSdk = project.extra.safeGet("compileSdkVersion") ?: defaultCompileSdkVersion
    defaultConfig {
      minSdk = project.extra.safeGet("minSdkVersion") ?: defaultMinSdkVersion
      targetSdk = project.extra.safeGet("targetSdkVersion") ?: defaultTargetSdkVersion
    }

    lintOptions.isAbortOnError = false
  }
}
