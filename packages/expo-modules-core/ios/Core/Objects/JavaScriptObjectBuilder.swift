// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A type that can decorate a `JavaScriptObject` with some properties.
 */
internal protocol JavaScriptObjectDecorator: ~Copyable {
  /**
   Decorates an existing `JavaScriptObject`.
   */
  @JavaScriptActor
  func decorate(object: borrowing JavaScriptObject, appContext: AppContext) throws
}

/**
 A type that can build and decorate a `JavaScriptObject` based on its attributes.
 */
internal protocol JavaScriptObjectBuilder: JavaScriptObjectDecorator, ~Copyable {
  /**
   Creates a decorated `JavaScriptObject` in the given app context.
   */
  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject
}

/**
 Provides the default behavior of `JavaScriptObjectBuilder`.
 The `build(appContext:)` creates a plain object and uses `decorate(object:appContext:)` for decoration.
 */
extension JavaScriptObjectBuilder {
  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject {
    let object = try appContext.runtime.createObject()
    try decorate(object: object, appContext: appContext)
    return object
  }

  @JavaScriptActor
  func decorate(object: borrowing JavaScriptObject, appContext: AppContext) throws {
    // no-op by default
  }
}
