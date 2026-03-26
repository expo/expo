// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Base class for optimized asynchronous function definitions.
 This is used by the `@OptimizedFunction` macro to generate subclasses with specific type signatures.
 The async variant creates a JS Promise and dispatches the block invocation to a background queue.
 */
open class BaseOptimizedAsyncFunctionDefinition: AnyAsyncFunctionDefinition, @unchecked Sendable {
  public let name: String
  public let typeEncoding: String
  public let argsCount: Int
  public let block: AnyObject

  var queue: DispatchQueue?

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

  public var takesOwner: Bool = false

  public func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> ()) {
    callback(.failure(GenericException("OptimizedAsyncFunctionDefinition cannot be called from native code")))
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  public func build(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createAsyncFunction(
      name,
      typeEncoding: typeEncoding,
      argsCount: argsCount,
      body: block
    )
  }

  // MARK: - AnyAsyncFunctionDefinition

  @discardableResult
  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    self.queue = queue
    return self
  }
}
