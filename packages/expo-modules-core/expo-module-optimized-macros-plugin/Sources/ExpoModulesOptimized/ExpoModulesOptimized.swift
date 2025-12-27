/// A macro that generates an optimized version of a function or closure.
/// Attach this macro to any function or closure to generate an optimized peer implementation.
/// For example:
///
///     @OptimizedFunction
///     func calculateSum(_ a: Int, _ b: Int) -> Int {
///         return a + b
///     }
///
/// generates an optimized version of the function.
@attached(peer, names: prefixed(_optimized_))
public macro OptimizedFunction() = #externalMacro(module: "ExpoModulesOptimizedMacros", type: "OptimizedFunctionMacro")
