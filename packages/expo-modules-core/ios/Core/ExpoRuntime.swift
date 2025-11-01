// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Class that extends the standard JavaScript runtime with some Expo-specific features.
 For instance, the global `expo` object is available only in Expo runtimes.
 */
public extension ExpoRuntime {
  internal func initializeCoreObject(_ coreObject: JavaScriptObject) throws {
    global().defineProperty(EXGlobalCoreObjectPropertyName, value: coreObject, options: .enumerable)
  }

  internal func getCoreObject() throws -> JavaScriptObject {
    return try global().getProperty(EXGlobalCoreObjectPropertyName).asObject()
  }

  internal func getSharedObjectClass() throws -> JavaScriptObject {
    return try getCoreObject().getProperty("SharedObject").asObject()
  }

  internal func getSharedRefClass() throws -> JavaScriptObject {
    return try getCoreObject().getProperty("SharedRef").asObject()
  }
}
