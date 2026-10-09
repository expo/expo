/**
 A protocol that must be implemented to be a part of module's definition and the module definition itself.
 */
public protocol AnyDefinition: ~Copyable {
  /**
   The definition's role, resolved through dynamic dispatch. Definition containers switch on it
   because a protocol cast that misses the runtime cache scans every conformance record in the process.
   */
  var definitionClassification: DefinitionClassification { get }
}

extension AnyDefinition where Self: ~Copyable {
  public var definitionClassification: DefinitionClassification { .unknown }
}

/**
 Classification of a definition element. Containers fall back to protocol casts for `unknown` elements.
 */
public struct DefinitionClassification {
  internal enum Kind {
    case unknown
    case function(AnyFunctionDefinition)
    case staticFunction(AnyStaticFunctionDefinition)
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

  internal init(_ kind: Kind) {
    self.kind = kind
  }

  public static var unknown: DefinitionClassification {
    return DefinitionClassification(.unknown)
  }
}
