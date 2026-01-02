// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin.optimized

import com.android.build.gradle.LibraryExtension
import com.google.devtools.ksp.gradle.KspExtension
import org.gradle.api.Plugin
import org.gradle.api.Project

/**
 * Gradle plugin that automates the setup for Expo modules with optimized functions.
 *
 * This plugin:
 * 1. Applies the KSP (Kotlin Symbol Processing) plugin
 * 2. Adds the annotation processor as a KSP dependency
 * 3. Configures source sets to include generated Kotlin code
 * 4. Configures KSP arguments for output directories
 *
 * Usage:
 * ```
 * plugins {
 *   id 'expo-module-optimized-gradle-plugin'
 * }
 * ```
 */
abstract class ExpoModuleOptimizedGradlePlugin : Plugin<Project> {
  override fun apply(project: Project) {
    // Create extension for user configuration
    val extension = project.extensions.create(
      "expoModuleOptimized",
      OptimizedModuleExtension::class.java
    )

    configureKsp(project, extension)
    configureSourceSets(project, extension)
  }

  private fun configureKsp(project: Project, extension: OptimizedModuleExtension) {
    with (project) {
      pluginManager.apply("com.google.devtools.ksp")

      val annotationProcessorProject = rootProject.project(":expo-modules-annotation-processor")
      dependencies.add("ksp", annotationProcessorProject)
      logger.info("Added KSP dependency: $annotationProcessorProject")

      // Get KSP extension with proper type
      val kspExtension = extensions.findByType(KspExtension::class.java)
      if (kspExtension == null) {
        logger.warn("KSP extension not found. Make sure KSP plugin is applied.")
        return
      }

      // Set Kotlin output directory (C++ generation is no longer needed!)
      val kotlinOutputDir = project.file(extension.kotlinOutputDir).absolutePath
      kspExtension.arg("expo.generated.kotlin.dir", kotlinOutputDir)
      logger.info("Set KSP arg: expo.generated.kotlin.dir = $kotlinOutputDir")
    }
  }

  /**
   * Configures Android source sets to include generated Kotlin code.
   */
  private fun configureSourceSets(project: Project, extension: OptimizedModuleExtension) {
    with (project) {
      val android = extensions.findByType(LibraryExtension::class.java)
      if (android == null) {
        logger.warn("Android library plugin not found. Skipping source set configuration.")
        return
      }

      val kotlinOutputDir = project.file(extension.kotlinOutputDir).absolutePath

      android.sourceSets.getByName("main") { sourceSet ->
        sourceSet.java.srcDir(kotlinOutputDir)
      }

      logger.info("Configured source set to include: $kotlinOutputDir")
    }
  }
}
