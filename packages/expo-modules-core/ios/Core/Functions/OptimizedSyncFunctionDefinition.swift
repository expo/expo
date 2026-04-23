// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Optimized synchronous function definition.
 This is used by the `@OptimizedFunction` macro with specific type signatures.
 */
public struct OptimizedSyncFunctionDefinition: AnySyncFunctionDefinition, @unchecked Sendable {
  public let name: String
  public let typeEncoding: String
  public let argsCount: Int
  public let block: AnyObject

  public init(name: String, typeEncoding: String, argsCount: Int, block: AnyObject) {
    self.name = name
    self.typeEncoding = typeEncoding
    self.argsCount = argsCount
    self.block = block
  }

  // MARK: - AnyFunction

  public var dynamicArgumentTypes: [AnyDynamicType] {
    return []
  }

  public var returnType: AnyDynamicType {
    return ~Void.self
  }

  public var argumentsCount: Int {
    return argsCount
  }

  public var requiredArgumentsCount: Int {
    // Optimized functions don't support optional arguments, so all args are required.
    return argsCount
  }

  public var takesOwner: Bool = false

  public func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> ()) {
    callback(.failure(GenericException("OptimizedSyncFunctionDefinition cannot be called from native code")))
  }

  // MARK: - AnySyncFunctionDefinition

  public func call(_ appContext: AppContext, in runtime: JavaScriptRuntime, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) throws(Exception) -> ExpoModulesJSI.JavaScriptValue {
    throw GenericException("OptimizedSyncFunctionDefinition cannot be called directly")
  }

  public func runBody(_ appContext: AppContext, in runtime: JavaScriptRuntime, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) throws(Exception) -> Any {
    throw GenericException("OptimizedSyncFunctionDefinition cannot be called directly")
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  public func build(appContext: AppContext) throws -> JavaScriptObject {
    return try build(appContext: appContext, in: appContext.runtime)
  }

  public func build(appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    var object = runtime.createObject()
    runtime.withUnsafePointee { runtimePointer in
      object.withUnsafeMutablePointee { objectPointer in
        OptimizedFunctionUtils.createSyncFunction(
          name: name,
          intoObject: objectPointer,
          runtimePointer: runtimePointer,
          typeEncoding: typeEncoding,
          argsCount: argsCount,
          block: block
        )
      }
    }
    return object
  }

  // MARK: - Descriptor Factory

  @inline(__always)
  public static func createDescriptor(
    typeEncoding: String,
    argsCount: Int,
    block: AnyObject
  ) -> OptimizedFunctionDescriptor {
    return OptimizedFunctionDescriptor(
      typeEncoding: typeEncoding,
      argsCount: argsCount,
      block: block
    )
  }
}

/**
 A lightweight descriptor carrying the optimized closure metadata.
 The JS-facing name is supplied separately via the `Function("name", descriptor)`
 or `AsyncFunction("name", descriptor)` overload.
 */
public struct OptimizedFunctionDescriptor {
  public let typeEncoding: String
  public let argsCount: Int
  public let block: AnyObject

  public init(typeEncoding: String, argsCount: Int, block: AnyObject) {
    self.typeEncoding = typeEncoding
    self.argsCount = argsCount
    self.block = block
  }
}

/**
 Helper function called by macro-generated code to create an optimized function descriptor.
 */
@inline(__always)
public func _createOptimizedFunctionDescriptor(
  typeEncoding: String,
  argsCount: Int,
  block: AnyObject
) -> OptimizedFunctionDescriptor {
  return OptimizedSyncFunctionDefinition.createDescriptor(
    typeEncoding: typeEncoding,
    argsCount: argsCount,
    block: block
  )
}
