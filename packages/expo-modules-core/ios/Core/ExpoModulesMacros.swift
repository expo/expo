
/**
 Declares macro signatures whose implementations are provided by the `@expo/expo-modules-macros-plugin` binary.
 Keep in sync with `@expo/expo-modules-macros-plugin/apple/Sources/ExpoModulesOptimized/ExpoModulesOptimized.swift`.
 */

// MARK: - Macro declarations

/// An attached macro that generates an optimized synchronous function descriptor.
/// Creates a peer function that returns `OptimizedFunctionDescriptor`, for use with
/// the `Function("name", descriptor)` overload in ModuleDefinition result builders.
///
/// Usage:
///
///     @OptimizedFunction
///     private func addNumbers(a: Double, b: Double) -> Double {
///         return a + b
///     }
///
///     // In definition():
///     Function("addNumbers", addNumbers())
///
/// The generated peer function uses the optimized JSI bridge path with
/// @convention(block) closures for maximum performance.
@attached(peer, names: arbitrary)
public macro OptimizedFunction() =
  #externalMacro(module: "ExpoModulesMacros", type: "OptimizedFunctionAttachedMacro")
