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

  init(name: String, elements: [ClassComponentElement]) {
    self.name = name
    self.constructor = elements.first(where: isConstructor) as? AnySyncFunctionComponent

    // Constructors can't be passed down to the object component
    // as we shouldn't override the default `<Class>.prototype.constructor`.
    let elementsWithoutConstructors = elements.filter({ !isConstructor($0) })

    super.init(definitions: elementsWithoutConstructors)
  }

  // MARK: - JavaScriptObjectBuilder

  public override func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    let klass = runtime.createClass(name) { [weak self, weak runtime] caller, arguments in
      guard let self = self, let runtime = runtime else {
        // TODO: Throw an exception? (@tsapeta)
        return
      }
      // The properties can't go into the prototype as they would be shared across all instances.
      // Instead, we decorate the instance object on initialization.
      self.decorateWithProperties(runtime: runtime, object: caller)

      // Call the native constructor when defined.
      let _ = try? self.constructor?.call(args: arguments)
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
