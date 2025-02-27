// Copyright 2022-present 650 Industries. All rights reserved.

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

  init<AssociatedObject: ClassAssociatedObject>(
    name: String,
    associatedType: AssociatedObject.Type,
    elements: [AnyClassDefinitionElement] = []
  ) {
    self.name = name
    self.constructor = elements.first(where: isConstructor) as? AnySyncFunctionDefinition
    self.associatedType = ~AssociatedObject.self
    self.isSharedRef = AssociatedObject.self is AnySharedRef.Type

    // Constructors can't be passed down to the object definition
    // as we shouldn't override the default `<Class>.prototype.constructor`.
    let elementsWithoutConstructors = elements.filter({ !isConstructor($0) })

    super.init(definitions: elementsWithoutConstructors)
  }

  // MARK: - JavaScriptObjectBuilder

  public override func build(appContext: AppContext) throws -> JavaScriptObject {
    let constructorBlock: ClassConstructorBlock = { [weak self, weak appContext] this, arguments in
      guard let self = self, let appContext else {
        // TODO: Throw an exception? (@tsapeta)
        return
      }

      // Call the native constructor when defined.
      let result = try? self.constructor?.call(by: this, withArguments: arguments, appContext: appContext)

      // Register the shared object if returned by the constructor.
      if let result = result as? SharedObject {
        appContext.sharedObjectRegistry.add(native: result, javaScript: this)
      }
    }

    let klass = try createClass(appContext: appContext, name: name, consturctor: constructorBlock)

    try decorate(object: klass, appContext: appContext)

    // Register the JS class and its associated native type.
    if let sharedObjectType = associatedType as? DynamicSharedObjectType {
      appContext.classRegistry.register(nativeClassId: sharedObjectType.typeIdentifier, javaScriptClass: klass)
    }

    return klass
  }

  public override func decorate(object: JavaScriptObject, appContext: AppContext) throws {
    // Here we actually don't decorate the input object (constructor) but its prototype.
    // Properties are intentionally skipped here — they have to decorate an instance instead of the prototype.
    let prototype = object.getProperty("prototype").getObject()

    try decorateWithConstants(object: prototype, appContext: appContext)
    try decorateWithFunctions(object: prototype, appContext: appContext)
    try decorateWithClasses(object: prototype, appContext: appContext)
    try decorateWithProperties(object: prototype, appContext: appContext)
  }
  
  private func createClass(appContext: AppContext, name: String, consturctor: @escaping ClassConstructorBlock) throws -> JavaScriptObject {
    if isSharedRef {
      return try appContext.runtime.createSharedRefClass(name, constructor: consturctor)
    }
    
    return try appContext.runtime.createSharedObjectClass(name, constructor: consturctor)
  }
}

// MARK: - ClassAssociatedObject

/**
 A protocol for types that can be used an associated type of the ``ClassDefinition``.
 */
internal protocol ClassAssociatedObject {}

// Basically we only need these two
extension JavaScriptObject: ClassAssociatedObject, AnyArgument, AnyJavaScriptValue {
  internal static func convert(from value: JavaScriptValue, appContext: AppContext) throws -> Self {
    guard value.kind == .object else {
      throw Conversions.ConvertingException<JavaScriptObject>(value)
    }
    return value.getObject() as! Self
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
fileprivate func isConstructor(_ item: AnyDefinition) -> Bool {
  return (item as? AnySyncFunctionDefinition)?.name == "constructor"
}
