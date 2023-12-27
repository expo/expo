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
      guard let desiredType = argumentType(atIndex: index) else {
        return nil
      }

      // If the type of argument matches the desired type, just cast and return it.
      // This usually covers all cases for primitive types or plain dicts and arrays.
      if desiredType.canCast(arg) {
        return desiredType.cast(arg)
      }

      // TODO: (@tsapeta) Handle structs convertible to dictionary
      // If we get here, the argument can be converted (not casted!) to the desired type.
      if let arg = arg as? Record.Dict, let dt = desiredType.castWrappedType(Record.Type.self) {
        return try dt.init(from: arg)
      }

      // TODO: (@tsapeta) Handle convertible arrays
      throw IncompatibleArgTypeError(
        argument: arg,
        atIndex: index,
        desiredType: desiredType
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

internal struct IncompatibleArgTypeError<ArgumentType>: CodedError {
  let argument: ArgumentType
  let atIndex: Int
  let desiredType: AnyArgumentType
  var description: String {
    "Type `\(type(of: argument))` of argument at index `\(atIndex)` is not compatible with expected type `\(desiredType.typeName)`."
  }
}
