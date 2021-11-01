import Dispatch

public class ConcreteMethod<Args, ReturnType>: AnyMethod {
  public typealias ClosureType = (Args) -> ReturnType

  public let name: String

  public var takesPromise: Bool {
    return argTypes.last?.canCastToType(Promise.self) ?? false
  }

  public var argumentsCount: Int {
    return argTypes.count - (takesPromise ? 1 : 0)
  }

  public var queue: DispatchQueue?

  let closure: ClosureType

  let argTypes: [AnyArgumentType]

  init(
    _ name: String,
    argTypes: [AnyArgumentType],
    _ closure: @escaping ClosureType
  ) {
    self.name = name
    self.argTypes = argTypes
    self.closure = closure
  }

  public func call(args: [Any?], promise: Promise) {
    let takesPromise = self.takesPromise
    let returnedValue: ReturnType?

    do {
      var finalArgs = try castArguments(args)

      if takesPromise {
        finalArgs.append(promise)
      }

      let tuple = try Conversions.toTuple(finalArgs) as! Args
      returnedValue = closure(tuple)
    } catch let error as CodedError {
      promise.reject(error)
      return
    } catch let error {
      promise.reject(UnexpectedError(error))
      return
    }
    if !takesPromise {
      promise.resolve(returnedValue)
    }
  }

  public func callSync(args: [Any?]) -> Any? {
    if takesPromise {
      var result: Any?
      let semaphore = DispatchSemaphore(value: 0)

      let promise = Promise {
        result = $0
        semaphore.signal()
      } rejecter: { error in
        semaphore.signal()
      }
      call(args: args, promise: promise)
      semaphore.wait()
      return result
    } else {
      do {
        let finalArgs = try castArguments(args)
        let tuple = try Conversions.toTuple(finalArgs) as! Args
        return closure(tuple)
      } catch let error {
        return error
      }
    }
  }

  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    self.queue = queue
    return self
  }

  private func argumentType(atIndex index: Int) -> AnyArgumentType? {
    return (0..<argTypes.count).contains(index) ? argTypes[index] : nil
  }

  private func castArguments(_ args: [Any?]) throws -> [AnyMethodArgument?] {
    if args.count != argumentsCount {
      throw InvalidArgsNumberError(received: args.count, expected: argumentsCount)
    }
    return try args.enumerated().map { (index, arg) in
      guard let expectedType = argumentType(atIndex: index) else {
        return nil
      }

      // If the type of argument matches the expected type, just cast and return it.
      // This usually covers all cases for primitive types or plain dicts and arrays.
      if expectedType.canCast(arg) {
        return expectedType.cast(arg)
      }

      // If we get here, the argument can be converted (not casted!) to the desired type.
      if let arg = arg as? Record.Dict, let dt = expectedType.castWrappedType(Record.Type.self) {
        return try dt.init(from: arg)
      }

      // Handle convertible types (e.g. CGPoint, CGRect, UIColor, ...)
      if let dt = expectedType.castWrappedType(ConvertibleArgument.Type.self) {
        return try dt.convert(from: arg)
      }

      // TODO: (@tsapeta) Handle convertible arrays
      throw IncompatibleArgTypeError(
        argument: arg,
        expectedType: expectedType
      )
    }
  }
}

internal struct InvalidArgsNumberError: CodedError {
  let received: Int
  let expected: Int
  var description: String {
    "Received \(received) arguments, but \(expected) was expected."
  }
}

/**
 Thrown when the value cannot be casted nor converted to given type.
 */
internal struct IncompatibleArgTypeError<ArgumentType>: CodedError {
  let argument: ArgumentType
  let expectedType: AnyArgumentType
  var description: String {
    "Argument `\(argument)` is not compatible with expected type `\(expectedType.typeName)`"
  }
}
