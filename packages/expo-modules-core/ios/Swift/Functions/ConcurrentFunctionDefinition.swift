import Dispatch

public final class ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>: AnyFunction {
  typealias ClosureType = (Args) async throws -> ReturnType

  let action: ClosureType

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    _ action: @escaping ClosureType
  ) {
    self.name = name
    self.action = action
    self.dynamicArgumentTypes = dynamicArgumentTypes
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  var takesOwner: Bool = false

  func call(by owner: AnyObject?, withArguments args: [Any], callback: @escaping (FunctionCallResult) -> Void) {
    let arguments: [Any]

    do {
      arguments = concat(
        arguments: try cast(arguments: args, forFunction: self),
        withOwner: owner,
        forFunction: self
      )
    } catch let error as Exception {
      callback(.failure(error))
      return
    } catch {
      callback(.failure(UnexpectedException(error)))
      return
    }

    Task { [arguments] in
      let result: Result<Any, Exception>

      do {
        let argumentsTuple = try Conversions.toTuple(arguments) as! Args
        let returnValue = try await action(argumentsTuple)

        result = .success(returnValue)
      } catch let error as Exception {
        result = .failure(FunctionCallException(name).causedBy(error))
      } catch {
        result = .failure(UnexpectedException(error))
      }

      callback(result)
    }
  }

  // MARK: - JavaScriptObjectBuilder

  func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    return runtime.createAsyncFunction(name, argsCount: argumentsCount) { [weak self, name] this, args, resolve, reject in
      guard let self = self else {
        let exception = NativeFunctionUnavailableException(name)
        return reject(exception.code, exception.description, nil)
      }
      self.call(by: this, withArguments: args) { result in
        switch result {
        case .failure(let error):
          reject(error.code, error.description, nil)
        case .success(let value):
          resolve(value)
        }
      }
    }
  }
}

/**
 Asynchronous function without arguments.
 */
public func AsyncFunction<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () async throws -> R
) -> ConcurrentFunctionDefinition<(), Void, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Asynchronous function with one argument.
 */
public func AsyncFunction<R, A0: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0) async throws -> R
) -> ConcurrentFunctionDefinition<(A0), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self],
    closure
  )
}

/**
 Asynchronous function with two arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self, ~A1.self],
    closure
  )
}

/**
 Asynchronous function with three arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2), A0, R> {
  return ConcurrentFunctionDefinition(
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
 Asynchronous function with four arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3), A0, R> {
  return ConcurrentFunctionDefinition(
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
 Asynchronous function with five arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4), A0, R> {
  return ConcurrentFunctionDefinition(
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
 Asynchronous function with six arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4, A5), A0, R> {
  return ConcurrentFunctionDefinition(
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
 Asynchronous function with seven arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4, A5, A6), A0, R> {
  return ConcurrentFunctionDefinition(
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
 Asynchronous function with eight arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4, A5, A6, A7), A0, R> {
  return ConcurrentFunctionDefinition(
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
