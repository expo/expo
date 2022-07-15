// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A protocol that allows converting raw values to enum cases.
 */
public protocol EnumArgument: AnyArgument {
  /**
   Tries to create an enum case using given raw value.
   May throw errors, e.g. when the raw value doesn't match any case.
   */
  static func create<RawValueType>(fromRawValue rawValue: RawValueType) throws -> Self

  /**
   Returns an array of all raw values available in the enum.
   */
  static var allRawValues: [Any] { get }

  /**
   Type-erased enum's raw value.
   */
  var anyRawValue: Any { get }
}

/**
 Extension for `EnumArgument` that also conforms to `RawRepresentable`.
 This constraint allows us to reference the associated `RawValue` type.
 */
public extension EnumArgument where Self: RawRepresentable, Self: Hashable {
  static func create<ArgType>(fromRawValue rawValue: ArgType) throws -> Self {
    guard let rawValue = rawValue as? RawValue else {
      throw EnumCastingException((type: RawValue.self, value: rawValue))
    }
    guard let enumCase = Self.init(rawValue: rawValue) else {
      throw EnumNoSuchValueException((type: Self.self, value: rawValue))
    }
    return enumCase
  }

  var anyRawValue: Any {
    rawValue
  }

  static var allRawValues: [Any] {
    // Be careful — it operates on unsafe pointers!
    let sequence = AnySequence { () -> AnyIterator<RawValue> in
      var raw = 0
      return AnyIterator {
        let current: Self? = withUnsafePointer(to: &raw) { ptr in
          ptr.withMemoryRebound(to: Self.self, capacity: 1) { $0.pointee }
        }
        guard let value = current?.rawValue else {
          return nil
        }
        raw += 1
        return value
      }
    }
    return Array(sequence)
  }
}

/**
 An error that is thrown when the value cannot be cast to associated `RawValue`.
 */
internal class EnumCastingException: GenericException<(type: Any.Type, value: Any)> {
  override var reason: String {
    "Unable to cast '\(param.value)' to expected type \(param.type)"
  }
}

/**
 An error that is thrown when the value doesn't match any available case.
 */
internal class EnumNoSuchValueException: GenericException<(type: EnumArgument.Type, value: Any)> {
  var allRawValuesFormatted: String {
    return param.type.allRawValues
      .map { "'\($0)'" }
      .joined(separator: ", ")
  }

  override var reason: String {
    "'\(param.value)' is not present in \(param.type) enum, it must be one of: \(allRawValuesFormatted)"
  }
}
