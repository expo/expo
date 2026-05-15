// Declares macro signatures whose implementations are provided by the `ExpoModulesMacros` compiler
// plugin shipped in the `@expo/expo-modules-macros-plugin` package. Keep the `#externalMacro`
// module/type names below in sync with the macro implementations in that package.

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

/// Marker macro applied to module / shared-object members that should be exposed to JavaScript.
/// The accompanying `@ExpoModule` and `@SharedObject` macros discover `@JS`-marked declarations
/// and generate the matching `Function` / `AsyncFunction` / `Property` / `Constructor` registrations.
///
/// Usage:
///
///     @JS
///     func greet(name: String) -> String { ... }
///
///     @JS("doWork")
///     func performWork() async throws { ... }
///
///     @JS
///     var status: String { "ok" }
@attached(peer)
public macro JS(_ jsName: String? = nil) =
  #externalMacro(module: "ExpoModulesMacros", type: "JSMacro")

/// Member macro applied to a `Module` subclass. Scans the class body for declarations
/// marked with `@JS` and synthesizes a framework-internal `_exposedDefinition()` method.
/// `expo-modules-core` calls it automatically and merges the result into the module's
/// definition, so the user doesn't have to reference it from `definition()`.
///
/// Usage:
///
///     @ExpoModule
///     public final class MyModule: Module {
///       public func definition() -> ModuleDefinition {
///         Name("MyModule")
///       }
///
///       @JS
///       func greet(name: String) -> String { "Hi, \(name)" }
///     }
@attached(member, names: named(_exposedDefinition), named(appContext), named(init))
public macro ExpoModule(_ name: String? = nil, classes: [Any.Type] = []) =
  #externalMacro(module: "ExpoModulesMacros", type: "ExpoModuleMacro")

/// Member macro applied to a `SharedObject` subclass. Scans the class body for declarations
/// marked with `@JS` (including a single `@JS init(...)` for the JS constructor) and
/// synthesizes a `_exposedClassDefinition()` static method returning a `ClassDefinition`.
/// The companion `@ExpoModule(classes: [Foo.self])` wires the class into the module's
/// exposed surface.
///
/// Usage:
///
///     @SharedObject
///     final class Cache: SharedObject {
///       @JS
///       init(name: String) { self.name = name }
///
///       @JS
///       func get(_ key: String) -> String? { ... }
///
///       @JS
///       var size: Int { 42 }
///     }
@attached(member, names: named(_exposedClassDefinition))
public macro SharedObject(_ name: String? = nil) =
  #externalMacro(module: "ExpoModulesMacros", type: "SharedObjectMacro")
