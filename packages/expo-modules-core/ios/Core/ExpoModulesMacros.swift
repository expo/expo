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
///
/// Also emits a never-called `_assertTypesConformance_<member>` peer that statically asserts every
/// type crossing the JS boundary conforms to the JS-convertible protocol, so a non-conforming type
/// fails to compile on the user's declaration. The peer name embeds the member name, hence
/// `names: arbitrary`.
@attached(peer, names: arbitrary)
public macro JS(_ jsName: String? = nil) =
  #externalMacro(module: "ExpoModulesMacros", type: "JSMacro")

/// Member macro applied to a `Module` subclass. Scans the class body for declarations
/// marked with `@JS` and synthesizes a framework-internal `_synthesizedDefinition()` method.
/// `expo-modules-core` calls it automatically and merges the result into the module's
/// definition, so the user doesn't have to reference it from `definition()`. `@JS` functions are
/// additionally bound directly into the module's JS object by a synthesized
/// `_decorateModule(object:in:appContext:)`.
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
@attached(
  member,
  names: named(_synthesizedDefinition), named(appContext), named(init), named(_decorateModule))
public macro ExpoModule(_ name: String? = nil, classes: [Any.Type] = []) =
  #externalMacro(module: "ExpoModulesMacros", type: "ExpoModuleMacro")

/// Member macro applied to a `SharedObject` subclass. Scans the class body for declarations
/// marked with `@JS` (including a single `@JS init(...)` for the JS constructor) and
/// synthesizes a `_synthesizedClassDefinition()` static method returning a `ClassDefinition`.
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
@attached(member, names: named(_synthesizedClassDefinition))
public macro SharedObject(_ name: String? = nil) =
  #externalMacro(module: "ExpoModulesMacros", type: "SharedObjectMacro")

/// Member + extension macro applied to a record `struct` or `class`. Every non-`static`,
/// non-`private`/`fileprivate`, non-`lazy`, non-computed stored property is part of the record — no
/// `@Field` wrapper needed — and the macro synthesizes the whole conversion surface from each
/// property's static type: a memberwise `init`, the `from(object:appContext:)` /
/// `from(dictionary:appContext:)` factories, and the `toDictionary(appContext:)` /
/// `toObject(appContext:)` write side. The type is auto-conformed to `Record`; the synthesized
/// methods override `Record`'s reflection-based defaults, so it stays usable anywhere a `Record`
/// argument is expected.
///
/// Requiredness is inferred from each property: a default value makes it optional, an optional type
/// makes it nullable and optional, and a non-optional property without a default is required (the
/// factories throw `RecordPropertyRequiredException` when the source omits it).
///
/// Usage:
///
///     @Record
///     struct Options {
///       var name: String          // required
///       var count: Int = 0        // optional (has default)
///       var note: String?         // nullable + optional
///     }
@attached(
  member,
  names: named(init), named(from), named(toDictionary), named(toObject),
  named(_assertTypesConformance))
@attached(extension, conformances: Record)
public macro Record() =
  #externalMacro(module: "ExpoModulesMacros", type: "RecordMacro")
