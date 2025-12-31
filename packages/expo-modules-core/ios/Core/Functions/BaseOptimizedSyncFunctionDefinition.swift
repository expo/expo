// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Base class for optimized synchronous function definitions.
 This is used by the `#OptimizedFunction` macro to generate subclasses with specific type signatures.
 */
open class BaseOptimizedSyncFunctionDefinition: AnySyncFunctionDefinition, @unchecked Sendable {
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

  public var takesOwner: Bool = false

  public func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> ()) {
    callback(.failure(GenericException("OptimizedSyncFunctionDefinition cannot be called from native code")))
  }

  // MARK: - AnySyncFunctionDefinition

  public func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext) throws -> Any {
    throw GenericException("OptimizedSyncFunctionDefinition cannot be called from native code")
  }

  public func call(_ appContext: AppContext, withThis this: JavaScriptValue?, arguments: [JavaScriptValue]) throws -> JavaScriptValue {
    throw GenericException("OptimizedSyncFunctionDefinition cannot be called directly")
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  public func build(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createSyncFunction(
      name,
      typeEncoding: typeEncoding,
      argsCount: argsCount,
      body: block
    )
  }
}

/**
 Helper function to create an optimized sync function definition.
 This wrapper ensures the return type is explicitly AnyDefinition, which helps
 Swift's type checker and result builders recognize the type before macro expansion.
 */
@inline(__always)
public func _createOptimizedFunction(
  name: String,
  typeEncoding: String,
  argsCount: Int,
  block: AnyObject
) -> AnyDefinition {
  return BaseOptimizedSyncFunctionDefinition(
    name: name,
    typeEncoding: typeEncoding,
    argsCount: argsCount,
    block: block
  )
}
