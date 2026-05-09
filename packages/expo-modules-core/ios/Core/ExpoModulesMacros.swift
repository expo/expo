
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

/// An attached macro that generates `_recordFields(of:)` on a `Record` type, replacing
/// the runtime `Mirror` walk used to discover `@Field`-annotated properties. Each entry
/// pairs a compile-time-resolved dictionary key with the underlying `AnyFieldInternal`
/// instance, so field lookup no longer needs reflection or per-field locking.
///
/// Usage:
///
///     @Record
///     struct Options: Record {
///       @Field var name: String = ""
///       @Field("custom_key") var flag: Bool = false
///       @Field(.required) var count: Int = 0
///     }
///
/// For class-based records that inherit from another `@Record` type, the generated
/// method overrides its superclass and prepends inherited fields via `super`.
@attached(member, names: named(_recordFields))
@attached(extension, conformances: Record, _RecordFieldsProvider)
public macro Record() =
  #externalMacro(module: "ExpoModulesMacros", type: "RecordMacro")
