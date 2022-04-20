// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Represents a function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.

 - ToDo: Move some asynchronous logic from `ConcreteFunction` (like `call(args:promise:)`) to this class and drop the `isAsync` property.
 */
public final class AsyncFunction<Args, ReturnType>: ConcreteFunction<Args, ReturnType> {
  override init(
    _ name: String,
    argTypes: [AnyArgumentType],
    _ closure: @escaping ConcreteFunction<Args, ReturnType>.ClosureType
  ) {
    super.init(name, argTypes: argTypes, closure)
    self.isAsync = true
  }
}
