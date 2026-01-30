// Copyright 2025-present 650 Industries. All rights reserved.

/**
 A protocol for static any type-erased function.
 */
internal protocol AnyStaticFunctionDefinition: AnyFunctionDefinition {
  /**
   Indicates whether the function is static.
   */
  var isStatic: Bool { get }
}

/**
 Represents a static function that can only be called synchronously.
 */
public final class StaticSyncFunctionDefinition<Args, FirstArgType, ReturnType>:
  SyncFunctionDefinition<Args, FirstArgType, ReturnType>, AnyStaticFunctionDefinition, @unchecked Sendable {
  let isStatic = true

//  override func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext) throws -> Any {
//    return try super.call(by: nil, withArguments: args, appContext: appContext)
//  }
//
//  override func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (consuming FunctionCallResult) -> Void) {
//    return super.call(by: nil, withArguments: args, appContext: appContext, callback: callback)
//  }
}

/**
 Represents a static function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 */
public final class StaticAsyncFunctionDefinition<Args, FirstArgType, ReturnType>:
  AsyncFunctionDefinition<Args, FirstArgType, ReturnType>, AnyStaticFunctionDefinition, @unchecked Sendable {
  let isStatic = true

//  override func call(
//    by owner: AnyObject?,
//    withArguments args: [Any],
//    appContext: AppContext,
//    callback: @Sendable @escaping (consuming FunctionCallResult) -> ()
//  ) {
//
//    return super.call(by: nil, withArguments: args, appContext: appContext, callback: callback)
//  }
}
