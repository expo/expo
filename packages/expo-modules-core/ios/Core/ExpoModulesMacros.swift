/**
 * Re-export the `@OptimizedFunction` or other macros from the standalone macros plugin package
 * (`@expo/expo-modules-macros-plugin`). This allows module authors to use the macro
 * by importing ExpoModulesCore alone, without adding a direct dependency on the plugin package.
 * Note: The plugin is not be available at compile time for prebuilts, so we need to 
 * conditionally import it and provide a fallback implementation of the macro.
 */
 #if canImport(ExpoModulesMacros)
 @_exported import ExpoModulesMacros
 #else
 @attached(peer, names: arbitrary)
 public macro OptimizedFunction() =
   #externalMacro(module: "ExpoModulesMacros", type: "OptimizedFunctionAttachedMacro")
 #endif
