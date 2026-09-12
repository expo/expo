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

/// Options passed to `@JS` after the optional JS name, e.g. `@JS(.concurrent)` or
/// `@JS("doWork", .concurrent)`. The macro reads them from the source, so spell them as `.option`
/// literals rather than constants.
public enum JSOptions {
  /// Runs the body of an `async` function on the concurrent thread pool instead of the JavaScript
  /// thread. Arguments are still decoded and the result encoded on the JavaScript thread, so only
  /// the function's own work moves. Use it for work that never touches JavaScript values, such as
  /// hashing or file IO. Only valid on an `async` function.
  ///
  /// The call sends the module or shared object off the JavaScript thread, so in Swift 6 language
  /// mode the enclosing class must be `Sendable`.
  case concurrent
}

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
///     @JS(.concurrent)
///     func digest(data: Data) async -> Data { ... }
///
///     @JS("doWork", .concurrent)
///     func performHeavyWork() async throws { ... }
///
/// Also emits a never-called `_assertTypesConformance_<member>` peer that statically asserts every
/// type crossing the JS boundary conforms to the JS-convertible protocol, so a non-conforming type
/// fails to compile on the user's declaration. The peer name embeds the member name, hence
/// `names: arbitrary`.
///
/// Trailing `JSOptions` tune the binding. The options-only overload exists because `.concurrent`
/// can't fill the unlabeled `jsName` slot.
@attached(peer, names: arbitrary)
public macro JS(_ jsName: String? = nil, _ options: JSOptions...) =
  #externalMacro(module: "ExpoModulesMacros", type: "JSMacro")

@attached(peer, names: arbitrary)
public macro JS(_ options: JSOptions...) =
  #externalMacro(module: "ExpoModulesMacros", type: "JSMacro")

/// Turns a function-typed `var` on a module or shared object into a typed JavaScript event.
/// Calling the property emits the event to JavaScript, with the closure's parameter as the payload.
///
/// The JS event name defaults to the property name with a leading `on` stripped (`onProgress` emits
/// `progress`); pass `@Event("customName")` to set it explicitly. The payload type must be
/// convertible to JavaScript, and a `() -> Void` property is a no-payload event.
///
/// Usage:
///
///     @Event
///     var onProgress: (ProgressEvent) -> Void
///
///     // Emit it from anywhere:
///     onProgress(ProgressEvent(percent: 50))
@attached(accessor)
@attached(peer, names: arbitrary)
public macro Event(_ name: String? = nil, sync: Bool = false) =
  #externalMacro(module: "ExpoModulesMacros", type: "EventMacro")

/// Member macro applied to a `Module` subclass. Scans the class body for declarations
/// marked with `@JS` and synthesizes a framework-internal `_synthesizedDefinition()` method.
/// `expo-modules-core` calls it automatically and merges the result into the module's
/// definition, so the user doesn't have to reference it from `definition()`. `@JS` functions are
/// additionally bound directly into the module's JS object by a synthesized
/// `_decorateModule(object:in:)`.
///
/// The module's JavaScript name is synthesized into a `_jsName` static and read by core, so there
/// is no `Name(…)` DSL entry. It defaults to the class name; pass `@ExpoModule("CustomName")` to
/// override it.
///
/// Usage:
///
///     @ExpoModule
///     public final class MyModule: Module {
///       @JS
///       func greet(name: String) -> String { "Hi, \(name)" }
///     }
@attached(
  member,
  names:
    named(_jsName), named(_synthesizedDefinition), named(appContext), named(init),
    named(_decorateModule))
@attached(memberAttribute)
@attached(extension, conformances: AnyModule)
public macro ExpoModule(_ name: String? = nil, classes: [Any.Type] = []) =
  #externalMacro(module: "ExpoModulesMacros", type: "ExpoModuleMacro")

/// Member macro applied to a `SharedObject` subclass. Scans the class body for declarations
/// marked with `@JS` (including a single `@JS init(...)` for the JS constructor) and
/// synthesizes a `_synthesizedClassDefinition()` static method returning a `ClassDefinition`.
/// The companion `@ExpoModule(classes: [Foo.self])` wires the class into the module's
/// exposed surface.
///
/// `@JS` methods and properties are bound directly onto the class prototype by an override of
/// `_decorateSharedObject(prototype:in:)`, and a single `@JS init(...)` becomes an override
/// of `_constructSharedObject(this:arguments:in:)` that builds the native instance from the
/// JS arguments. Core calls both when building the class, so the synthesized `Class(…)` block carries
/// no DSL entries for the `@JS` members.
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
@attached(
  member,
  names:
    named(_synthesizedClassDefinition), named(_decorateSharedObject), named(_constructSharedObject))
@attached(memberAttribute)
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

/// Member + extension macro applied to an `enum` whose cases each carry one associated value. The enum
/// becomes a typed union of the payload types (`A | B` in TypeScript), the named, N-case counterpart
/// of `Either`. It can be a `@JS` argument or return value, an `@Event` payload, or nested in an
/// optional, array or dictionary. Synthesized members:
///
/// - `decode(_:in:)` tries the cases in declaration order and returns the first whose payload decodes.
///   Overlapping payloads (`Int` and `Double`, records with compatible fields) resolve to the earlier
///   case, so put the more specific case first. Throws `Exceptions.UnionCaseMismatch` when none match.
/// - `encode(_:in:)` encodes the payload of the held case.
/// - `as(_:)`, one overload per payload type: `try source.as(String.self)` unwraps the payload without
///   naming the case and throws `Exceptions.UnionCaseMismatch` when a different case is held.
///
/// The type is conformed to `JavaScriptDecodable` and `JavaScriptEncodable`, and every payload type
/// must conform to both. Generic enums, payload-less cases, multiple associated values, defaults on an
/// associated value and repeated payload types are compile errors.
///
/// Usage:
///
///     @Union
///     enum Source {
///       case text(String)
///       case options(SourceOptions)   // a @Record
///     }
///
///     @JS
///     func load(_ source: Source) {       // JS: string | SourceOptions
///       switch source {
///       case .text(let text): ...
///       case .options(let options): ...
///       }
///     }
@attached(
  member,
  names: named(decode), named(encode), named(`as`), named(_payloadTypeName),
  named(_assertTypesConformance))
@attached(extension, conformances: JavaScriptDecodable, JavaScriptEncodable)
public macro Union() =
  #externalMacro(module: "ExpoModulesMacros", type: "UnionMacro")
