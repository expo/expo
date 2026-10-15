/**
 A protocol that must be implemented to be a part of module's definition and the module definition itself.
 */
public protocol AnyDefinition: ~Copyable {
  /**
   The kind of definition element this is, so containers can switch on it instead of casting to each element protocol.
   A protocol cast that misses the runtime cache walks every conformance record.
   A type that does not override this returns `.unknown`.
   */
  var _definitionClassification: DefinitionClassification { get }
}

extension AnyDefinition where Self: ~Copyable {
  public var _definitionClassification: DefinitionClassification { .unknown }
}

/**
 The kind of a definition element together with the element itself.
 Only `.unknown` is public, so a conformer outside of this module cannot classify itself.
 When a kind is added, every container switch must handle it, and the `.unknown` fallbacks must stay in sync.
 */
public struct DefinitionClassification {
  internal enum Kind {
    case unknown
    case function(AnyFunctionDefinition)
    case staticFunction(AnyFunctionDefinition)
    case legacyConstants(ConstantsDefinition)
    case constant(AnyConstantDefinition)
    case property(AnyPropertyDefinition)
    case klass(ClassDefinition)
    case moduleName(ModuleNameDefinition)
    case eventListener(EventListener)
    case events(EventsDefinition)
    case eventObserver(AnyEventObservingDefinition)
    case view(AnyViewDefinition)
    case viewProp(AnyViewProp)
    case viewName(ViewNameDefinition)
    case viewLifecycle(AnyViewLifecycleMethod)
  }

  internal let kind: Kind

  public static var unknown: DefinitionClassification {
    return DefinitionClassification(kind: .unknown)
  }
}
