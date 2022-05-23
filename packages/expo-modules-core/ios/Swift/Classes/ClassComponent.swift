// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Represents a JavaScript class.
 */
public final class ClassComponent: ObjectDefinition {
  /**
   Name of the class.
   */
  let name: String

  /**
   A synchronous function that gets called when the object of this class is initializing.
   */
  let constructor: AnySyncFunctionComponent?

  /**
   A dynamic type for the associated object class.
   */
  let associatedType: AnyDynamicType?

  init<AssociatedObject: ClassAssociatedObject>(
    name: String,
    associatedType: AssociatedObject.Type,
    elements: [AnyClassComponentElement] = []
  ) {
    self.name = name
    self.constructor = elements.first(where: isConstructor) as? AnySyncFunctionComponent
    self.associatedType = ~AssociatedObject.self

    // Constructors can't be passed down to the object component
    // as we shouldn't override the default `<Class>.prototype.constructor`.
    let elementsWithoutConstructors = elements.filter({ !isConstructor($0) })

    super.init(definitions: elementsWithoutConstructors)
  }

  // MARK: - JavaScriptObjectBuilder

  public override func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    let klass = runtime.createClass(name) { [weak self, weak runtime] this, arguments in
      guard let self = self, let runtime = runtime else {
        // TODO: Throw an exception? (@tsapeta)
        return
      }
      // The properties can't go into the prototype as they would be shared across all instances.
      // Instead, we decorate the instance object on initialization.
      self.decorateWithProperties(runtime: runtime, object: this)

      // Call the native constructor when defined.
      let result = try? self.constructor?.call(by: this, withArguments: arguments)

      // Register the shared object if returned by the constructor.
      if let result = result as? SharedObject {
        SharedObjectRegistry.add(native: result, javaScript: this)
      }
    }
    decorate(object: klass, inRuntime: runtime)
    return klass
  }

  public override func decorate(object: JavaScriptObject, inRuntime runtime: JavaScriptRuntime) {
    // Here we actually don't decorate the input object (constructor) but its prototype.
    // Properties are intentionally skipped here — they have to decorate an instance instead of the prototype.
    let prototype = object.getProperty("prototype").getObject()
    decorateWithConstants(runtime: runtime, object: prototype)
    decorateWithFunctions(runtime: runtime, object: prototype)
    decorateWithClasses(runtime: runtime, object: prototype)
  }
}

// MARK: - ClassAssociatedObject

/**
 A protocol for types that can be used an associated type of the `ClassComponent`.
 */
internal protocol ClassAssociatedObject {}

// Basically we only need these two
extension JavaScriptObject: ClassAssociatedObject {}
extension SharedObject: ClassAssociatedObject {}

// MARK: - Privates

/**
 Checks whether the definition item is a constructor — a synchronous function whose name is "constructor".

 We do it that way for the following two reasons:
 - It's easier to reuse existing `SyncFunctionComponent`.
 - Redefining prototype's `constructor` is a bad idea so a function with this name
   needs to be filtered out when decorating the prototype.
 */
fileprivate func isConstructor(_ item: AnyDefinition) -> Bool {
  return (item as? AnySyncFunctionComponent)?.name == "constructor"
}
