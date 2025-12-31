/// An attached macro that generates an optimized synchronous function definition factory.
/// Creates a peer function that returns AnyDefinition, suitable for use in result builders.
///
/// Usage:
///
///     @OptimizedFunction("addNumbers")
///     private func addNumbersImpl(a: Double, b: Double) -> Double {
///         return a + b
///     }
///
/// Generates a peer function:
///
///     private func addNumbers() -> AnyDefinition {
///         return _createOptimizedFunction(...)
///     }
///
/// The generated peer function can be called directly in ModuleDefinition result builders.
/// It uses the optimized JSI bridge path with @convention(block) closures for maximum performance.
@attached(peer, names: arbitrary)
public macro OptimizedFunction(_ name: String) = #externalMacro(module: "ExpoModulesOptimizedMacros", type: "OptimizedFunctionAttachedMacro")
