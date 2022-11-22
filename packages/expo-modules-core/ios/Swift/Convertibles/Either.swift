// Copyright 2022-present 650 Industries. All rights reserved.

/*
 A convertible type wrapper for a value that should be either of two generic types.
 */
open class Either<FirstType, SecondType>: Convertible {
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

  // MARK: - Convertible

  public class func convert(from value: Any?) throws -> Self {
    if value is FirstType || value is SecondType {
      return Self(value)
    }
    throw NeitherTypeException(Self.dynamicTypes())
  }
}

/*
 A convertible type wrapper for a value that should be either of three generic types.
 */
open class EitherOfThree<FirstType, SecondType, ThirdType>: Either<FirstType, SecondType> {
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

  // MARK: - Convertible

  public override class func convert(from value: Any?) throws -> Self {
    return value is ThirdType ? Self(value) : try super.convert(from: value)
  }
}

/*
 A convertible type wrapper for a value that should be either of four generic types.
 */
open class EitherOfFour<FirstType, SecondType, ThirdType, FourthType>: EitherOfThree<FirstType, SecondType, ThirdType> {
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

  // MARK: - Convertible

  public override class func convert(from value: Any?) throws -> Self {
    return value is FourthType ? Self(value) : try super.convert(from: value)
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
