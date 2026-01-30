// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Represents a JavaScript class.
 */
public final class ClassDefinition: ObjectDefinition {
  /**
   Name of the class.
   */
  let name: String

  /**
   A synchronous function that gets called when the object of this class is initializing.
   */
  let constructor: AnySyncFunctionDefinition?

  /**
   A dynamic type for the associated object class.
   */
  let associatedType: AnyDynamicType?

  /**
   Whether the associatedType inherits from `SharedRef`.
   */
  let isSharedRef: Bool

  private init(_ name: String, associatedType: AnyDynamicType, isSharedRef: Bool, elements: [AnyClassDefinitionElement] = []) {
    self.name = name
    self.constructor = elements.first(where: isConstructor) as? AnySyncFunctionDefinition
    self.associatedType = associatedType
    self.isSharedRef = isSharedRef

    // Constructors can't be passed down to the object definition
    // as we shouldn't override the default `<Class>.prototype.constructor`.
    let elementsWithoutConstructors = elements.filter({ !isConstructor($0) })

    super.init(definitions: elementsWithoutConstructors)
  }

  convenience init<AssociatedObject: ClassAssociatedObject>(name: String, associatedType: AssociatedObject.Type, elements: [AnyClassDefinitionElement] = []) {
    self.init(name, associatedType: ~AssociatedObject.self, isSharedRef: AssociatedObject.self is AnySharedRef.Type, elements: elements)
  }

  convenience init(name: String, elements: [AnyClassDefinitionElement] = []) {
    self.init(name, associatedType: DynamicJavaScriptType.shared, isSharedRef: false, elements: elements)
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  public override func build(appContext: AppContext) throws -> JavaScriptObject {
    let constructorClosure: JavaScriptRuntime.SyncFunctionClosure = { [weak self, weak appContext] this, arguments in
      guard let self, let appContext else {
        let exception = NSException(
          name: NSExceptionName("ExpoClassConstructorException"),
          reason: "Call to function '\(String(describing: self?.name)).constructor' has been rejected.\n→ Caused by: App context was lost",
          userInfo: nil
        )
        exception.raise()
        return .undefined()
      }

      // Call the native constructor when defined.
      do {
        if let constructor {
          let result = try constructor.call(appContext, this: this, arguments: arguments)

          // Register the shared object if returned by the constructor.
//          if let result = result as? SharedObject {
//            appContext.sharedObjectRegistry.add(native: result, javaScript: this)
//          }
        }
      } catch let error as Exception {
        let exception = NSException(
          name: NSExceptionName("ExpoClassConstructorException"),
          reason: error.description,
          userInfo: ["code": error.code]
        )
        exception.raise()
      } catch {
        let exception = NSException(
          name: NSExceptionName("ExpoClassConstructorException"),
          reason: error.localizedDescription,
          userInfo: nil
        )
        exception.raise()
      }
      return .undefined()
    }

    let klass = try createClass(appContext: appContext, name: name, constructorClosure).asObject()

    try decorate(object: klass, appContext: appContext)

    // Register the JS class and its associated native type.
    if let sharedObjectType = associatedType as? DynamicSharedObjectType {
      appContext.classRegistry.register(nativeClassId: sharedObjectType.typeIdentifier, javaScriptClass: klass)
    }

    return klass
  }

  @JavaScriptActor
  public override func decorate(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    try decorateWithStaticFunctions(object: object, appContext: appContext)

    // Here we actually don't decorate the input object (constructor) but its prototype.
    // Properties are intentionally skipped here — they have to decorate an instance instead of the prototype.
    let prototype = object.getProperty("prototype").getObject()

    try decorateWithConstants(object: prototype, appContext: appContext)
    try decorateWithFunctions(object: prototype, appContext: appContext)
    try decorateWithClasses(object: prototype, appContext: appContext)
    try decorateWithProperties(object: prototype, appContext: appContext)
  }

  @JavaScriptActor
  private func createClass(appContext: AppContext, name: String, _ constructor: @escaping JavaScriptRuntime.SyncFunctionClosure) throws -> JavaScriptFunction {
    if isSharedRef {
      return try appContext.runtime.createSharedRefClass(name, constructor)
    }
    return try appContext.runtime.createSharedObjectClass(name, constructor)
  }
}

// MARK: - ClassAssociatedObject

/**
 A protocol for types that can be used an associated type of the ``ClassDefinition``.
 */
internal protocol ClassAssociatedObject: ~Copyable {}

// Basically we only need these two
extension JavaScriptObject: ClassAssociatedObject, AnyArgument, AnyJavaScriptValue {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicJavaScriptType.shared
  }

  public static func convert(from value: borrowing JavaScriptValue, appContext: AppContext) throws -> Self {
    guard value.kind == .object else {
      throw Conversions.UnexpectedValueType((received: value.kind, expected: .object))
    }
    return value.getObject()
  }
}
extension SharedObject: ClassAssociatedObject {}

// MARK: - Privates

/**
 Checks whether the definition item is a constructor — a synchronous function whose name is "constructor".

 We do it that way for the following two reasons:
 - It's easier to reuse existing `SyncFunctionDefinition`.
 - Redefining prototype's `constructor` is a bad idea so a function with this name
   needs to be filtered out when decorating the prototype.
 */
private func isConstructor(_ item: AnyDefinition) -> Bool {
  return (item as? AnySyncFunctionDefinition)?.name == "constructor"
}
