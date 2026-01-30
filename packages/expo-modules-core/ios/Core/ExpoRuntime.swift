// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Class that extends the standard JavaScript runtime with some Expo-specific features.
 For instance, the global `expo` object is available only in Expo runtimes.
 */
public class ExpoRuntime: JavaScriptRuntime, @unchecked Sendable {
  @JavaScriptActor
  internal func getCoreObject() throws -> JavaScriptObject {
    return try global().getProperty(EXGlobalCoreObjectPropertyName).asObject()
  }

  @JavaScriptActor
  internal func getEventEmitterClass() throws -> JavaScriptFunction {
    return try getCoreObject().getPropertyAsFunction("EventEmitter")
  }

  @JavaScriptActor
  internal func getSharedObjectClass() throws -> JavaScriptFunction {
    return try getCoreObject().getPropertyAsFunction("SharedObject")
  }

  @JavaScriptActor
  internal func getSharedRefClass() throws -> JavaScriptFunction {
    return try getCoreObject().getPropertyAsFunction("SharedRef")
  }

  @JavaScriptActor
  internal func createNativeModuleObject() throws -> JavaScriptObject {
    return try getCoreObject()
      .getPropertyAsFunction("NativeModule")
      .callAsConstructor()
      .asObject()
  }

  @JavaScriptActor
  internal func createSharedObjectClass(_ name: String, _ constructor: @escaping SyncFunctionClosure) throws -> JavaScriptFunction {
    let sharedObjectBaseClass = try getSharedObjectClass()
    return try createClass(name: name, inheriting: sharedObjectBaseClass, constructor)
  }

  @JavaScriptActor
  internal func createSharedRefClass(_ name: String, _ constructor: @escaping SyncFunctionClosure) throws -> JavaScriptFunction {
    let sharedRefBaseClass = try getSharedRefClass()
    return try createClass(name: name, inheriting: sharedRefBaseClass, constructor)
  }
}
