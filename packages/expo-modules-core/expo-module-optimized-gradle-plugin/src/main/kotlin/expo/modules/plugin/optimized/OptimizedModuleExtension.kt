// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin.optimized

/**
 * Extension for configuring optimized function code generation.
 *
 * Example usage in build.gradle:
 * ```
 * expoModuleOptimized {
 *   cppOutputDir = "build/generated/cpp/expo"
 *   kotlinOutputDir = "build/generated/ksp/kotlin"
 * }
 * ```
 */
open class OptimizedModuleExtension {
  /**
   * Directory where generated C++ adapter code will be placed.
   * Default: "build/generated/cpp/expo"
   */
  var cppOutputDir: String = "build/generated/cpp/expo"

  /**
   * Directory where generated Kotlin registry code will be placed.
   * Default: "build/generated/ksp/kotlin"
   */
  var kotlinOutputDir: String = "build/generated/ksp/kotlin"

  /**
   * Whether to automatically configure CMake to include generated C++ sources.
   * If false, you must manually configure your CMakeLists.txt to include the generated sources.
   * Default: true
   */
  var enableCMakeIntegration: Boolean = true

  /**
   * Directory where the generated CMakeLists.txt will be placed.
   * Default: "build/generated/cmake"
   */
  var cmakeOutputDir: String = "build/generated/cmake"
}
