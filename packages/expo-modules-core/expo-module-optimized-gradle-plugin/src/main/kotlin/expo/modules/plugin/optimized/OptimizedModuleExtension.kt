// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.plugin.optimized

/**
 * Extension for configuring optimized function code generation.
 *
 * Example usage in build.gradle:
 * ```
 * expoModuleOptimized {
 *   kotlinOutputDir = "build/generated/ksp/kotlin"
 * }
 * ```
 */
open class OptimizedModuleExtension {

  /**
   * Directory where generated Kotlin registry code will be placed.
   * Default: "build/generated/ksp/kotlin"
   */
  var kotlinOutputDir: String = "build/generated/ksp/kotlin"
}
