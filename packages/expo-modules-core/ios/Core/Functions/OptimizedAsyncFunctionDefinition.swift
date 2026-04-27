// Copyright 2025-present 650 Industries. All rights reserved.

import Dispatch
import ExpoModulesJSI

/**
 Optimized asynchronous function definition.
 This is used by the `@OptimizedFunction` macro with specific type signatures.
 The async variant creates a JS Promise and dispatches the block invocation to a background queue.
 */
public struct OptimizedAsyncFunctionDefinition: AnyAsyncFunctionDefinition, @unchecked Sendable {
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
    callback(.failure(GenericException("OptimizedAsyncFunctionDefinition cannot be called from native code")))
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  public func build(appContext: AppContext) throws -> JavaScriptObject {
    // TODO: Re-implement optimized async function registration using the new JSI API.
    // The old implementation used NSInvocation with ObjC type encoding to bypass
    // JavaScriptValue boxing for primitive types, dispatching to a background queue
    // and returning a JS Promise. See OptimizedSyncFunctionDefinition for more context.
    throw Exception(
      name: "OptimizedFunctionUnavailable",
      description: "OptimizedAsyncFunctionDefinition is not yet implemented with the new JSI API",
      code: "ERR_OPTIMIZED_FUNCTION_UNAVAILABLE"
    )
  }

  // MARK: - AnyAsyncFunctionDefinition

  @discardableResult
  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    // Queue dispatch is handled at the ObjC/JSI layer for optimized functions
    return self
  }
}
