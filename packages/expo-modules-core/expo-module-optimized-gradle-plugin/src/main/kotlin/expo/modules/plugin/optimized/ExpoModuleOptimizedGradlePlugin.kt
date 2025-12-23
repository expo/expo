// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin.optimized

import com.android.build.gradle.LibraryExtension
import com.google.devtools.ksp.gradle.KspExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import java.io.File

/**
 * Gradle plugin that automates the setup for Expo modules with optimized functions.
 *
 * This plugin:
 * 1. Applies the KSP (Kotlin Symbol Processing) plugin
 * 2. Adds the annotation processor as a KSP dependency
 * 3. Configures source sets to include generated Kotlin code
 * 4. Configures KSP arguments for output directories
 * 5. Optionally configures CMake to include generated C++ sources
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
    configureCMake(project, extension)
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

      // Set C++ output directory
      val cppOutputDir = project.file(extension.cppOutputDir).absolutePath
      kspExtension.arg("expo.generated.cpp.dir", cppOutputDir)
      logger.info("Set KSP arg: expo.generated.cpp.dir = $cppOutputDir")

      // Set Kotlin output directory
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

  /**
   * Configures CMake to include generated C++ sources.
   *
   * By default, this is enabled and will:
   * 1. Generate a CMakeLists.txt in build/generated/cmake/
   * 2. Configure CMake build with the generated C++ directory
   */
  private fun configureCMake(project: Project, extension: OptimizedModuleExtension) {
    with (project) {
      if (!extension.enableCMakeIntegration) {
        logger.info("CMake integration is disabled")
        return
      }

      val android = extensions.findByType(LibraryExtension::class.java)
      if (android == null) {
        logger.warn("Android library plugin not found. Skipping CMake configuration.")
        return
      }

      // Use prefab
      android.buildFeatures.prefab = true

      // Generate CMakeLists.txt in build/generated/cmake/
      val cmakeDir = project.file(extension.cmakeOutputDir)
      cmakeDir.mkdirs()
      val cmakeFile = File(cmakeDir, "CMakeLists.txt")

      // Always regenerate the CMakeLists.txt to ensure it's up-to-date
      copyTemplateCMakeLists(this, cmakeFile)
      logger.info("Generated CMakeLists.txt at: ${cmakeFile.absolutePath}")

      // Configure CMake build
      val externalCmakeOptions = android.defaultConfig.externalNativeBuild.cmake
      externalCmakeOptions.abiFilters(*getReactNativeArchitectures(this))
      externalCmakeOptions.arguments.add("-DANDROID_STL=c++_shared")
      externalCmakeOptions.arguments.add("-DEXPO_GENERATED_PROJECT_NAME=${project.name}")
      val cppOutputDir = project.file(extension.cppOutputDir).absolutePath
      externalCmakeOptions.arguments.add("-DEXPO_GENERATED_CPP_DIR=$cppOutputDir")

      val cmakeOptions = android.externalNativeBuild.cmake
      cmakeOptions.path = cmakeFile

      logger.info("Configured CMake with generated C++ directory: $cppOutputDir")
    }
  }

  /**
   * Copies the template CMakeLists.txt from plugin resources to the project directory.
   */
  private fun copyTemplateCMakeLists(project: Project, targetFile: File) {
    val logger = project.logger
    try {
      // Read template from plugin resources
      val templateStream = ExpoModuleOptimizedGradlePlugin::class.java.classLoader.getResourceAsStream("CMakeLists.txt")
      if (templateStream != null) {
        targetFile.writeText(templateStream.bufferedReader().readText())
        logger.info("Created CMakeLists.txt from template: ${targetFile.absolutePath}")
      } else {
        logger.warn("Could not find CMakeLists.txt template in plugin resources")
      }
    } catch (e: Exception) {
      logger.warn("Failed to copy CMakeLists.txt template: ${e.message}")
    }
  }

  private fun getReactNativeArchitectures(project: Project): Array<String> {
    val properties = project.rootProject.properties
    val value = properties["reactNativeArchitectures"] as? String
    return value?.split(",")?.toTypedArray() ?: arrayOf("armeabi-v7a", "x86", "x86_64", "arm64-v8a")
  }
}
