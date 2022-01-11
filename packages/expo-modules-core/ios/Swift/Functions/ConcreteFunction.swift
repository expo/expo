import Dispatch

public final class ConcreteFunction<Args, ReturnType>: AnyFunction {
  public typealias ClosureType = (Args) throws -> ReturnType

  public let name: String

  public var takesPromise: Bool {
    return argTypes.last is PromiseArgumentType
  }

  public var argumentsCount: Int {
    return argTypes.count - (takesPromise ? 1 : 0)
  }

  public var queue: DispatchQueue?

  public var isAsync: Bool = true

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

  public func call(args: [Any], promise: Promise) {
    let takesPromise = self.takesPromise
    let returnedValue: ReturnType?

    do {
      var finalArgs = try castArguments(args)

      if takesPromise {
        finalArgs.append(promise)
      }

      let tuple = try Conversions.toTuple(finalArgs) as! Args
      returnedValue = try closure(tuple)
    } catch let error as CodedError {
      promise.reject(FunctionCallException(name).causedBy(error))
      return
    } catch let error {
      promise.reject(UnexpectedError(error))
      return
    }
    if !takesPromise {
      promise.resolve(returnedValue)
    }
  }

  public func callSync(args: [Any]) -> Any {
    if takesPromise {
      var result: Any?
      let semaphore = DispatchSemaphore(value: 0)

      let promise = Promise {
        result = $0
        semaphore.signal()
      } rejecter: { _ in
        semaphore.signal()
      }
      call(args: args, promise: promise)
      semaphore.wait()
      return result as Any
    } else {
      do {
        let finalArgs = try castArguments(args)
        let tuple = try Conversions.toTuple(finalArgs) as! Args
        return try closure(tuple)
      } catch let error {
        return error
      }
    }
  }

  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    self.queue = queue
    return self
  }

  public func runSynchronously() -> Self {
    self.isAsync = false
    return self
  }

  private func argumentType(atIndex index: Int) -> AnyArgumentType? {
    return (0..<argTypes.count).contains(index) ? argTypes[index] : nil
  }

  private func castArguments(_ args: [Any]) throws -> [Any] {
    if args.count != argumentsCount {
      throw InvalidArgsNumberException((received: args.count, expected: argumentsCount))
    }
    return try args.enumerated().map { index, arg in
      let expectedType = argumentType(atIndex: index)

      do {
        // It's safe to unwrap since the arguments count matches.
        return try expectedType!.cast(arg)
      } catch {
        throw ArgumentCastException((index: index, type: expectedType!)).causedBy(error)
      }
    }
  }
}

internal class InvalidArgsNumberException: GenericException<(received: Int, expected: Int)> {
  override var reason: String {
    "Received \(params.received) arguments, but \(params.expected) was expected."
  }
}

internal class ArgumentCastException: GenericException<(index: Int, type: AnyArgumentType)> {
  override var reason: String {
    "Argument at index '\(params.index)' couldn't be casted to type '\(params.type.description)'."
  }
}

internal class FunctionCallException: GenericException<String> {
  override var reason: String {
    "Call to function '\(params)' has been rejected."
  }
}
