/**
 * Re-export the `@OptimizedFunction` macro from the standalone macros plugin package
 * (`@expo/expo-module-optimized-macros-plugin`). This allows module authors to use the macro
 * by importing ExpoModulesCore alone, without adding a direct dependency on the plugin package.
 */
@_exported import ExpoModuleOptimizedMacros
