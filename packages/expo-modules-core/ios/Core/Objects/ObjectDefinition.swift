// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Base class for other definitions representing an object, such as `ModuleDefinition`.
 */
public class ObjectDefinition: AnyDefinition, JavaScriptObjectBuilder {
  public var definitionClassification: DefinitionClassification {
    return .unknown
  }

  /**
   A dictionary of functions defined by the object.
   */
  let functions: [String: AnyFunctionDefinition]

  /**
   A dictionary of static functions defined by the object.
   */
  let staticFunctions: [String: AnyFunctionDefinition]

  /**
   An array of constants definitions.
   */
  let legacyConstants: [ConstantsDefinition]

  /**
   A map of constants defined by the object.
   */
  let constants: [String: AnyConstantDefinition]

  /**
   A map of dynamic properties defined by the object.
   */
  let properties: [String: AnyPropertyDefinition]

  /**
   A map of classes defined within the object.
   */
  let classes: [String: ClassDefinition]

  /**
   Default initializer receiving children definitions from the result builder.
   */
  init(definitions: [AnyDefinition]) {
    var functions = [String: AnyFunctionDefinition]()
    var staticFunctions = [String: AnyFunctionDefinition]()
    var legacyConstants = [ConstantsDefinition]()
    var constants = [String: AnyConstantDefinition]()
    var properties = [String: AnyPropertyDefinition]()
    var classes = [String: ClassDefinition]()

    for definition in definitions {
      switch definition.definitionClassification.kind {
      case .function(let function):
        functions[function.name] = function
      case .staticFunction(let function):
        staticFunctions[function.name] = function
      case .legacyConstants(let constantsDefinition):
        legacyConstants.append(constantsDefinition)
      case .constant(let constant):
        constants[constant.name] = constant
      case .property(let property):
        properties[property.name] = property
      case .klass(let klass):
        classes[klass.name] = klass
      case .unknown:
        if let function = definition as? AnyFunctionDefinition, !(function is AnyStaticFunctionDefinition) {
          functions[function.name] = function
        }
        if let function = definition as? AnyStaticFunctionDefinition {
          staticFunctions[function.name] = function
        }
        if let constantsDefinition = definition as? ConstantsDefinition {
          legacyConstants.append(constantsDefinition)
        }
        if let constant = definition as? AnyConstantDefinition {
          constants[constant.name] = constant
        }
        if let property = definition as? AnyPropertyDefinition {
          properties[property.name] = property
        }
        if let klass = definition as? ClassDefinition {
          classes[klass.name] = klass
        }
      default:
        break
      }
    }

    self.functions = functions
    self.staticFunctions = staticFunctions
    self.legacyConstants = legacyConstants
    self.constants = constants
    self.properties = properties
    self.classes = classes
  }

  /**
   Merges all `constants` definitions into one dictionary.
   */
  func getLegacyConstants() -> [String: Any?] {
    return legacyConstants.reduce(into: [String: Any?]()) { dict, definition in
      dict.merge(definition.body()) { $1 }
    }
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  public func build(appContext: AppContext) throws -> JavaScriptObject {
    let object = try appContext.runtime.createObject()
    try decorate(object: object, appContext: appContext)
    return object
  }

  @JavaScriptActor
  public func decorate(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    try decorateWithConstants(object: object, appContext: appContext)
    try decorateWithFunctions(object: object, appContext: appContext)
    try decorateWithProperties(object: object, appContext: appContext)
    try decorateWithClasses(object: object, appContext: appContext)
  }

  // MARK: - Internals

  @JavaScriptActor
  internal func decorateWithConstants(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    for (key, value) in getLegacyConstants() {
      object.setProperty(key, value: try Conversions.anyToJavaScriptValue(value, appContext: appContext))
    }

    for constant in constants.values {
      let descriptor = try constant.buildDescriptor(appContext: appContext)
      object.defineProperty(constant.name, descriptor: descriptor)
    }
  }

  @JavaScriptActor
  internal func decorateWithFunctions(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    for fn in functions.values {
      object.setProperty(fn.name, value: try fn.build(appContext: appContext))
    }
  }

  @JavaScriptActor
  internal func decorateWithStaticFunctions(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    for fn in staticFunctions.values {
      object.setProperty(fn.name, value: try fn.build(appContext: appContext))
    }
  }

  @JavaScriptActor
  internal func decorateWithProperties(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    for property in properties.values {
      let descriptor = try property.buildDescriptor(appContext: appContext)
      object.defineProperty(property.name, descriptor: descriptor)
    }
  }

  @JavaScriptActor
  internal func decorateWithClasses(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    for klass in classes.values {
      object.setProperty(klass.name, value: try klass.build(appContext: appContext))
    }
  }
}
