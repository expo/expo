import ExpoModulesJSI

let DEFAULT_MODULE_VIEW = "DEFAULT_MODULE_VIEW"

/**
 The definition of the module. It is used to define some parameters
 of the module and what it exports to the JavaScript world.
 See `ModuleDefinitionBuilder` for more details on how to create it.
 */
public final class ModuleDefinition: ObjectDefinition {
  /**
   The module's type associated with the definition. It's used to create the module instance.
   */
  var type: AnyModule.Type?

  /**
   Name of the defined module. Falls back to the type name if not provided in the definition.
   */
  var name: String

  let eventListeners: [EventListener]

  let views: [String: AnyViewDefinition]

  /**
   Names of the events that the module can send to JavaScript.
   */
  let eventNames: [String]

  let eventObservers: [AnyEventObservingDefinition]

  /// The raw list of definitions used to construct this module. Retained so
  /// that `ModuleHolder` can merge in the entries synthesized by the
  /// `@ExpoModule` macro without losing the user-authored ones.
  let rawDefinitions: [AnyDefinition]

  /**
   Initializer that is called by the `ModuleDefinitionBuilder` results builder.
   */
  override init(definitions: [AnyDefinition]) {
    self.rawDefinitions = definitions

    var name: String?
    var eventListeners = [EventListener]()
    var viewDefinitions = [AnyViewDefinition]()
    var eventNames = [String]()
    var eventObservers = [AnyEventObservingDefinition]()

    for definition in definitions {
      switch definition.definitionClassification.kind {
      case .moduleName(let nameDefinition):
        name = nameDefinition.name
      case .eventListener(let listener):
        eventListeners.append(listener)
      case .view(let view):
        viewDefinitions.append(view)
      case .events(let events):
        eventNames.append(contentsOf: events.names)
      case .eventObserver(let observer):
        eventObservers.append(observer)
      case .unknown:
        if let nameDefinition = definition as? ModuleNameDefinition {
          name = nameDefinition.name
        }
        if let listener = definition as? EventListener {
          eventListeners.append(listener)
        }
        if let view = definition as? AnyViewDefinition {
          viewDefinitions.append(view)
        }
        if let events = definition as? EventsDefinition {
          eventNames.append(contentsOf: events.names)
        }
        if let observer = definition as? AnyEventObservingDefinition {
          eventObservers.append(observer)
        }
      default:
        break
      }
    }

    self.name = name ?? ""
    self.eventListeners = eventListeners
    var viewsDict = Dictionary(uniqueKeysWithValues: viewDefinitions.map { ($0.name, $0) })
    viewsDict[DEFAULT_MODULE_VIEW] = viewDefinitions.first
    self.views = viewsDict
    self.eventNames = eventNames
    self.eventObservers = eventObservers

    super.init(definitions: definitions)
  }

  /**
   Sets the module type that the definition is associated with. We can't pass this in the initializer
   as it's called by the results builder that doesn't have access to the type.
   */
  func withType(_ type: AnyModule.Type) -> Self {
    self.type = type

    // Use the type name if the name is not in the definition or was defined empty.
    if name.isEmpty {
      name = _typeName(type, qualified: false)
    }
    return self
  }

  @JavaScriptActor
  public override func build(appContext: AppContext) throws -> JavaScriptObject {
    // Create an instance of `global.expo.NativeModule`
    let object = try appContext.runtime.createNativeModuleObject()

    try super.decorate(object: object, appContext: appContext)

    let viewPrototypesObject = try appContext.runtime.createObject()

    try views.forEach { key, view in
      let reactComponentPrototype = try view.createReactComponentPrototype(appContext: appContext)
      viewPrototypesObject.setProperty(key == DEFAULT_MODULE_VIEW ? name : "\(name)_\(view.name)", value: reactComponentPrototype)
    }

    if !eventObservers.isEmpty {
      try EventObservingDecorator(definitions: eventObservers)
        .decorate(object: object, appContext: appContext)
    }

    object.setProperty("ViewPrototypes", value: viewPrototypesObject)
    // Give the module object a name. It's used for compatibility reasons, see `EventEmitter.ts`.
    object.defineProperty("__expo_module_name__", value: name, options: [])

    return object
  }
}

/**
 Module's name definition. Returned by `name()` in module's definition.
 */
internal struct ModuleNameDefinition: AnyDefinition {
  var definitionClassification: DefinitionClassification {
    return DefinitionClassification(.moduleName(self))
  }

  let name: String
}

/**
 A definition for module's constants. Returned by `constants(() -> SomeType)` in module's definition.
 */
internal struct ConstantsDefinition: AnyDefinition {
  var definitionClassification: DefinitionClassification {
    return DefinitionClassification(.legacyConstants(self))
  }

  let body: () -> [String: Any?]
}

/**
 A definition for module's events that can be sent to JavaScript.
 */
public struct EventsDefinition: AnyDefinition {
  public var definitionClassification: DefinitionClassification {
    return DefinitionClassification(.events(self))
  }

  let names: [String]
}
