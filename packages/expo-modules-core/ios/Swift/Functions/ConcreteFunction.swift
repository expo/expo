import Dispatch

public class ConcreteFunction<Args, ReturnType>: AnyFunction {
  public typealias ClosureType = (Args) throws -> ReturnType

  public let name: String

  public var takesPromise: Bool

  public var argumentsCount: Int {
    return argumentTypes.count
  }

  public var queue: DispatchQueue?

  public var isAsync: Bool = true

  let closure: ClosureType

  public let argumentTypes: [AnyArgumentType]

  init(
    _ name: String,
    argTypes: [AnyArgumentType],
    _ closure: @escaping ClosureType
  ) {
    self.name = name
    self.takesPromise = argTypes.last is PromiseArgumentType
    self.closure = closure

    // Drop the last argument type if it's the `Promise`.
    self.argumentTypes = takesPromise ? argTypes.dropLast(1) : argTypes

    // This is temporary solution to keep backwards compatibility for existing functions — they all end with "Async".
    // `function` component that we've used so far was async by default, but we decided to replace it with `asyncFunction`
    // and make `function`s synchronous. Introduced in SDK45, can be removed in SDK46 after migrating all modules.
    self.isAsync = name.hasSuffix("Async")
  }

  /**
   Calls the function with given arguments.
   - Parameters:
     - args: An array of arguments to pass to the function. The arguments must be of the same type as in the underlying ``closure``.
     - promise: A promise to resolve or reject by the async ``closure`` when it finishes execution.
   - ToDo: Make it internal.
   */
  public func call(args: [Any], promise: Promise) {
    // Add promise to the array of arguments if necessary.
    let arguments = takesPromise ? args + [promise] : args
    let returnedValue: ReturnType?

    do {
      let argumentsTuple = try Conversions.toTuple(arguments) as! Args
      returnedValue = try closure(argumentsTuple)
    } catch let error as CodedError {
      promise.reject(FunctionCallException(name).causedBy(error))
      return
    } catch {
      promise.reject(UnexpectedException(error))
      return
    }
    if !takesPromise {
      promise.resolve(returnedValue)
    }
  }

  /**
   Calls the function synchronously with given arguments.
   - Parameters:
     - args: An array of arguments to pass to the function. The arguments must be of the same type as in the underlying ``closure``.
   - Returns: A value returned by the called function when succeeded or an error when it failed.
   - ToDo: Make it internal.
   */
  public func callSync(args: [Any]) -> Any {
    if takesPromise {
      // Using `Promise` in the synchronous function is prohibited. Probably should throw an exception here,
      // but for now let's return nil until we split async and sync functions.
      return Optional<Any>.none as Any
    }
    do {
      let argumentsTuple = try Conversions.toTuple(args) as! Args
      return try closure(argumentsTuple)
    } catch let error {
      return error
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
}

internal class FunctionCallException: GenericException<String> {
  override var reason: String {
    "Call to function '\(param)' has been rejected"
  }
}
