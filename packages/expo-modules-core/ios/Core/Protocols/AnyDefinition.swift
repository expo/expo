/**
 A protocol that must be implemented to be a part of module's definition and the module definition itself.
 */
public protocol AnyDefinition: ~Copyable {
  /**
   Sorts the definition into the bucket matching its concrete kind. Each concrete definition type appends
   itself to the matching array, which is a static upcast resolved at compile time. This replaces the chain
   of `compactMap { $0 as? SomeProtocol }` casts that `ObjectDefinition`/`ModuleDefinition`/`ViewDefinition`
   used to run on every element: with hundreds of distinct generic `Function<...>` types in an app, each
   (type, protocol) pair triggered a full `swift_conformsToProtocol` scan of every loaded image's
   conformance records, which dominated module registration time at startup.
   */
  func __collect(into buckets: inout DefinitionBuckets)
  var __isConstructor: Bool { get }
}

extension AnyDefinition {
  public func __collect(into buckets: inout DefinitionBuckets) {}
  public var __isConstructor: Bool { false }
}

/**
 Definitions grouped by kind, filled by `AnyDefinition.__collect(into:)`.
 */
public struct DefinitionBuckets {
  var functions: [AnyFunctionDefinition] = []
  var staticFunctions: [AnyFunctionDefinition] = []
  var legacyConstants: [ConstantsDefinition] = []
  var constants: [AnyConstantDefinition] = []
  var properties: [AnyPropertyDefinition] = []
  var classes: [ClassDefinition] = []
  var moduleNames: [ModuleNameDefinition] = []
  var eventListeners: [EventListener] = []
  var views: [AnyViewDefinition] = []
  var events: [EventsDefinition] = []
  var eventObservers: [AnyEventObservingDefinition] = []
  var viewProps: [AnyViewProp] = []
  var viewNames: [ViewNameDefinition] = []
  var lifecycleMethods: [AnyViewLifecycleMethod] = []

  public init() {}
}
