// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Type-erased protocol for synchronous functions.
 */
internal protocol AnySyncFunctionComponent: AnyFunction {
  /**
   Calls the function synchronously with given arguments.
   - Parameters:
     - owner: An object that calls this function. If the `takesOwner` property is true
       and type of the first argument matches the owner type, it's being passed as the argument.
     - args: An array of arguments to pass to the function. The arguments must be of the same type as in the underlying closure.
   - Returns: A value returned by the called function when succeeded or an error when it failed.
   */
  func call(by owner: AnyObject?, withArguments args: [Any]) throws -> Any
}

/**
 Represents a function that can only be called synchronously.
 */
public final class SyncFunctionComponent<Args, FirstArgType, ReturnType>: AnySyncFunctionComponent {
  typealias ClosureType = (Args) throws -> ReturnType

  /**
   The underlying closure to run when the function is called.
   */
  let body: ClosureType

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    _ body: @escaping ClosureType
  ) {
    self.name = name
    self.dynamicArgumentTypes = dynamicArgumentTypes
    self.body = body
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var takesOwner: Bool = false

  func call(by owner: AnyObject?, withArguments args: [Any], callback: @escaping (FunctionCallResult) -> ()) {
    do {
      let result = try call(by: owner, withArguments: args)
      callback(.success(result))
    } catch let error as Exception {
      callback(.failure(error))
    } catch {
      callback(.failure(UnexpectedException(error)))
    }
  }

  // MARK: - AnySyncFunctionComponent

  func call(by owner: AnyObject?, withArguments args: [Any]) throws -> Any {
    do {
      let arguments = concat(
        arguments: try cast(arguments: args, forFunction: self),
        withOwner: owner,
        forFunction: self
      )
      let argumentsTuple = try Conversions.toTuple(arguments) as! Args
      return try body(argumentsTuple)
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  // MARK: - JavaScriptObjectBuilder

  func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    return runtime.createSyncFunction(name, argsCount: argumentsCount) { [weak self, name] this, args in
      guard let self = self else {
        throw NativeFunctionUnavailableException(name)
      }
      return try self.call(by: this, withArguments: args)
    }
  }
}

/**
 Synchronous function without arguments.
 */
public func Function<R>(
  _ name: String,
  _ closure: @escaping () throws -> R
) -> SyncFunctionComponent<(), Void, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Synchronous function with one argument.
 */
public func Function<R, A0: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0) throws -> R
) -> SyncFunctionComponent<(A0), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self],
    closure
  )
}

/**
 Synchronous function with two arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1) throws -> R
) -> SyncFunctionComponent<(A0, A1), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self, ~A1.self],
    closure
  )
}

/**
 Synchronous function with three arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self
    ],
    closure
  )
}

/**
 Synchronous function with four arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self
    ],
    closure
  )
}

/**
 Synchronous function with five arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3, A4), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self
    ],
    closure
  )
}

/**
 Synchronous function with six arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3, A4, A5), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self
    ],
    closure
  )
}

/**
 Synchronous function with seven arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3, A4, A5, A6), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self,
      ~A6.self
    ],
    closure
  )
}

/**
 Synchronous function with eight arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) throws -> R
) -> SyncFunctionComponent<(A0, A1, A2, A3, A4, A5, A6, A7), A0, R> {
  return SyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self,
      ~A6.self,
      ~A7.self
    ],
    closure
  )
}
