// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Class that extends the standard JavaScript runtime with some Expo-specific features.
 For instance, the global `expo` object is available only in Expo runtimes.
 */
public class ExpoRuntime: JavaScriptRuntime, @unchecked Sendable {
  @JavaScriptActor
  internal func getCoreObject() throws -> JavaScriptObject {
    return try global().getProperty(globalCoreObjectPropertyName).asObject()
  }

  @JavaScriptActor
  internal func getSharedObjectClass() throws -> JavaScriptFunction {
    return try getCoreObject().getPropertyAsFunction("SharedObject")
  }

  @JavaScriptActor
  internal func getSharedRefClass() throws -> JavaScriptFunction {
    return try getCoreObject().getPropertyAsFunction("SharedRef")
  }

  /// Creates an instance of the base `SharedObject` class, or of the base `SharedRef` class if `isSharedRef` is true.
  /// The prototypes of both classes are looked up once per runtime and cached.
  @JavaScriptActor
  internal func createBaseSharedObject(isSharedRef: Bool) throws -> JavaScriptObject {
    let key = isSharedRef ? sharedRefPrototypeKey : sharedObjectPrototypeKey
    let makePrototype = {
      let baseClass = try isSharedRef ? self.getSharedRefClass() : self.getSharedObjectClass()
      return try baseClass.asObject().getPropertyAsObject("prototype")
    }
    return try withCached(key, makePrototype) { (prototype: borrowing JavaScriptObject) in
      return createObject(prototype: prototype)
    }
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

/// Keys of the base `SharedObject` and `SharedRef` prototypes in each runtime's cache.
private let sharedObjectPrototypeKey = JavaScriptRuntime.Cache.Key<JavaScriptObject.Ref>()
private let sharedRefPrototypeKey = JavaScriptRuntime.Cache.Key<JavaScriptObject.Ref>()
