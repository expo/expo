// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type that represents an optional type, which allows `nil` to be passed when casting.
 Requires the optional's wrapped type as it delegates casting to that type for non-nil values.
 */
internal struct DynamicOptionalType: AnyDynamicType {
  let wrappedType: AnyDynamicType

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    if let OptionalType = InnerType.self as? AnyOptional.Type {
      return wrappedType.equals(OptionalType.getWrappedDynamicType())
    }
    return false
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let optionalType = type as? Self {
      return optionalType.wrappedType.equals(wrappedType)
    }
    return false
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.isUndefined() || jsValue.isNull() {
      return Optional<Any>.none as Any
    }
    return try wrappedType.cast(jsValue: jsValue, appContext: appContext)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if Optional.isNil(value) || value is NSNull {
      return Optional<Any>.none as Any
    }
    return try wrappedType.cast(value, appContext: appContext)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if Optional.isNil(value) || value is NSNull {
      return .null
    }
    return try wrappedType.castToJS(value, appContext: appContext)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    // Delegate the conversion to the wrapped type
    return try wrappedType.convertResult(result, appContext: appContext)
  }

  var description: String {
    "\(wrappedType)?"
  }
}

/**
 A type-erased protocol used to recognize if the generic type is an optional type.
 `Optional` is a generic enum, so it's impossible to check the inheritance directly.
 */
internal protocol AnyOptional {
  /**
   Exposes the `Wrapped` generic type wrapped by the dynamic type to preserve its metadata.`
   */
  static func getWrappedDynamicType() -> AnyDynamicType

  /**
   Whether the optional holds no value. Implemented on `Optional` directly so the check
   runs with the concrete `Wrapped` type known.
   */
  var isNone: Bool { get }
}

/**
 Make generic `Optional` implement non-generic `AnyOptional` and add handy check against type-erased `nil`.
 */
extension Optional: AnyOptional {
  static func getWrappedDynamicType() -> AnyDynamicType {
    return ~Wrapped.self
  }

  var isNone: Bool {
    if case .none = self {
      return true
    }
    return false
  }

  /**
   Checks whether the given type-erased value is `Optional.none`, regardless of the
   Optional's `Wrapped` generic parameter. Uses an `AnyOptional` protocol cast, which
   is backed by a witness table and runs in O(1).
   */
  static func isNil(_ object: Wrapped) -> Bool {
    return (object as? AnyOptional)?.isNone ?? false
  }
}
