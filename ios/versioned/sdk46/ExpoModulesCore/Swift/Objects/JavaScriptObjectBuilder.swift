// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A type that can decorate a `JavaScriptObject` with some properties.
 */
internal protocol JavaScriptObjectDecorator {
  /**
   Decorates an existing `JavaScriptObject`.
   */
  func decorate(object: JavaScriptObject, inRuntime runtime: JavaScriptRuntime)
}

/**
 A type that can build and decorate a `JavaScriptObject` based on its attributes.
 */
internal protocol JavaScriptObjectBuilder: JavaScriptObjectDecorator {
  /**
   Creates a decorated `JavaScriptObject` in the given runtime.
   */
  func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject
}

/**
 Provides the default behavior of `JavaScriptObjectBuilder`.
 The `build(inRuntime:)` creates a plain object and uses `decorate(object:)` for decoration.
 */
extension JavaScriptObjectBuilder {
  func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    let object = runtime.createObject()
    decorate(object: object, inRuntime: runtime)
    return object
  }

  func decorate(object: JavaScriptObject, inRuntime runtime: JavaScriptRuntime) {
    // no-op by default
  }
}
