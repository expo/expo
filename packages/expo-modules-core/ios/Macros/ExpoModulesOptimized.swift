/// An attached macro that generates an optimized function descriptor.
/// Creates a peer function that returns `OptimizedFunctionDescriptor`, for use with
/// the `Function("name", descriptor)` or `AsyncFunction("name", descriptor)` overloads
/// in ModuleDefinition result builders.
///
/// Usage (synchronous):
///
///     @OptimizedFunction
///     private func addNumbers(a: Double, b: Double) -> Double {
///         return a + b
///     }
///
///     // In definition():
///     Function("addNumbers", addNumbers())
///
/// Usage (asynchronous):
///
///     @OptimizedFunction
///     private func computeValue(x: Double) -> Double {
///         return expensiveComputation(x)
///     }
///
///     // In definition():
///     AsyncFunction("computeValue", computeValue())
///
/// You can also provide an explicit peer name if the Swift function name differs:
///
///     @OptimizedFunction("addNumbers")
///     private func addNumbersImpl(a: Double, b: Double) -> Double { ... }
///
///     // In definition():
///     Function("addNumbers", addNumbers())
///
/// The generated peer function uses the optimized JSI bridge path with
/// @convention(block) closures for maximum performance.
@attached(peer, names: arbitrary)
public macro OptimizedFunction(_ name: String) = #externalMacro(module: "ExpoModulesOptimizedMacros", type: "OptimizedFunctionAttachedMacro")

/// Variant that derives the peer function name from the Swift function name.
@attached(peer, names: arbitrary)
public macro OptimizedFunction() = #externalMacro(module: "ExpoModulesOptimizedMacros", type: "OptimizedFunctionAttachedMacro")
