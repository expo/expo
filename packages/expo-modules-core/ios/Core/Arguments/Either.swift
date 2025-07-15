// Copyright 2022-present 650 Industries. All rights reserved.

protocol AnyEither: AnyArgument {
  /**
   An initializer with the underlying type-erased value.
   */
  init(_ value: Any?)

  /**
   An array of dynamic equivalents for generic either types.
   */
  static func dynamicTypes() -> [AnyDynamicType]

  /**
   A dynamic either type for the current either type.
   */
  static func getDynamicType() -> any AnyDynamicType
}

/*
 A convertible type wrapper for a value that should be either of two generic types.
 */
open class Either<FirstType, SecondType>: AnyEither, AnyArgument {
  public class func getDynamicType() -> any AnyDynamicType {
    return DynamicEitherType(eitherType: Either<FirstType, SecondType>.self)
  }

  /**
   An array of dynamic equivalents for generic either types.
   */
  class func dynamicTypes() -> [AnyDynamicType] {
    return [~FirstType.self, ~SecondType.self]
  }

  /**
   The underlying type-erased value.
   */
  let value: Any?

  required public init(_ value: Any?) {
    self.value = value
  }

  /**
   Returns a bool whether the value is of the first type.
   */
  public func `is`(_ type: FirstType.Type) -> Bool {
    return value is FirstType
  }

  /**
   Returns a bool whether the value is of the second type.
   */
  public func `is`(_ type: SecondType.Type) -> Bool {
    return value is SecondType
  }

  /**
   Returns the value as of the first type or `nil` if it's not of this type.
   */
  public func get() -> FirstType? {
    return value as? FirstType
  }

  /**
   Returns the value as of the second type or `nil` if it's not of this type.
   */
  public func get() -> SecondType? {
    return value as? SecondType
  }

  public func `as`<ReturnType>(_ type: ReturnType.Type) throws -> ReturnType {
    if let value = value as? ReturnType {
      return value
    }
    throw Conversions.CastingException<ReturnType>(value as Any)
  }
}

/*
 A convertible type wrapper for a value that should be either of three generic types.
 */
open class EitherOfThree<FirstType, SecondType, ThirdType>: Either<FirstType, SecondType> {
  override public class func getDynamicType() -> any AnyDynamicType {
    return DynamicEitherType(eitherType: EitherOfThree<FirstType, SecondType, ThirdType>.self)
  }

  override class func dynamicTypes() -> [AnyDynamicType] {
    return super.dynamicTypes() + [~ThirdType.self]
  }

  /**
   Returns a bool whether the value is of the third type.
   */
  public func `is`(_ type: ThirdType.Type) -> Bool {
    return value is ThirdType
  }

  /**
   Returns the value as of the third type or `nil` if it's not of this type.
   */
  public func get() -> ThirdType? {
    return value as? ThirdType
  }
}

/*
 A convertible type wrapper for a value that should be either of four generic types.
 */
open class EitherOfFour<FirstType, SecondType, ThirdType, FourthType>: EitherOfThree<FirstType, SecondType, ThirdType> {
  override public class func getDynamicType() -> any AnyDynamicType {
    return DynamicEitherType(eitherType: EitherOfFour<FirstType, SecondType, ThirdType, FourthType>.self)
  }

  override class func dynamicTypes() -> [AnyDynamicType] {
    return super.dynamicTypes() + [~FourthType.self]
  }

  /**
   Returns a bool whether the value is of the fourth type.
   */
  public func `is`(_ type: FourthType.Type) -> Bool {
    return value is FourthType
  }

  /**
   Returns the value as of the fourth type or `nil` if it's not of this type.
   */
  public func get() -> FourthType? {
    return value as? FourthType
  }
}

// MARK: - Exceptions

/**
 An exception thrown when the value is of neither type.
 */
internal class NeitherTypeException: GenericException<[AnyDynamicType]> {
  override var reason: String {
    var typeDescriptions = param.map({ $0.description })
    let lastTypeDescription = typeDescriptions.removeLast()

    return "Type must be either: \(typeDescriptions.joined(separator: ", ")) or \(lastTypeDescription)"
  }
}
