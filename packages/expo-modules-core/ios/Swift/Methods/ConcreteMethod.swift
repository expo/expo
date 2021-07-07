
public struct ConcreteMethod<Args, ReturnType>: AnyMethod {
  public typealias ClosureType = (Args) -> ReturnType

  public let name: String

  public var takesPromise: Bool {
    return argTypes.last?.canCast(Promise.self) ?? false
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
    queue: DispatchQueue? = nil,
    _ closure: @escaping ClosureType) {
    self.name = name
    self.argTypes = argTypes
    self.queue = queue
    self.closure = closure

    print(name, argTypes, takesPromise)
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
    } catch let error {
      promise.reject(error)
      return
    }
    if !takesPromise {
      promise.resolve(returnedValue)
    }
  }

  private func argumentType(atIndex index: Int) -> AnyArgumentType? {
    return (0..<argTypes.count).contains(index) ? argTypes[index] : nil
  }

  private func castArguments(_ args: [Any?]) throws -> [AnyMethodArgument?] {
    return try args.enumerated().map { (index, arg) in
      guard let desiredType = argumentType(atIndex: index) else {
        return nil
      }

      // If the type of argument matches the desired type, just cast and return it.
      // This usually covers all cases for primitive types or plain dicts and arrays.
      if desiredType.canCast(arg) {
        return desiredType.cast(arg)
      }

      // TODO: Handle structs convertible to dictionary
//      // If we get here, the argument can be converted (not casted!) to the desired type.
//      if let arg = arg as? [AnyHashable : Any?], let dt = desiredType.castWrappedType(ConvertibleFromDictionary.Type.self) {
//        return dt.init(dictionary: arg)
//      }

      // TODO: Handle convertible arrays
//      if let arg = arg as? [Any?] {
//
//      }
      throw Errors.IncompatibleArgumentType(
        argument: arg,
        atIndex: index,
        desiredType: type(of: desiredType)
      )
    }
  }
}
