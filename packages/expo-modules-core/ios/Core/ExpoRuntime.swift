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
    let prototypes = try cached(baseSharedObjectPrototypesKey) {
      return try BaseSharedObjectPrototypes(in: self)
    }
    if isSharedRef {
      return createObject(prototype: prototypes.sharedRef)
    }
    return createObject(prototype: prototypes.sharedObject)
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

/// The prototypes of the base `SharedObject` and `SharedRef` classes.
private final class BaseSharedObjectPrototypes {
  let sharedObject: JavaScriptObject
  let sharedRef: JavaScriptObject

  @JavaScriptActor
  init(in runtime: ExpoRuntime) throws {
    sharedObject = try runtime.getSharedObjectClass().asObject().getPropertyAsObject("prototype")
    sharedRef = try runtime.getSharedRefClass().asObject().getPropertyAsObject("prototype")
  }
}

/// Key of the base shared object prototypes in each runtime's cache.
private let baseSharedObjectPrototypesKey = JavaScriptRuntime.Cache.Key<BaseSharedObjectPrototypes>()
