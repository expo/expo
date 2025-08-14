// Copyright 2021-present 650 Industries. All rights reserved.

protocol AnyValueOrUndefined: AnyArgument {}

public enum ValueOrUndefined<InnerType: AnyArgument>: AnyValueOrUndefined {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicValueOrUndefinedType<InnerType>()
  }

  case undefined
  case value(unwrapped: InnerType)

  var optional: InnerType? {
    switch self {
    // We want to produce Optional(nil) instead of nil - that's what DynamicOptionalType does
    case .undefined: return Any??.some(nil) as Any?? as! InnerType?
    case .value(let value): return value
    }
  }

  var isUndefinded: Bool {
    if case .undefined = self {
      return true
    }

    return false
  }
}

extension ValueOrUndefined: Equatable where InnerType: Equatable {
  public static func == (lhs: ValueOrUndefined, rhs: ValueOrUndefined) -> Bool {
    switch (lhs, rhs) {
    case (.undefined, .undefined):
      return true
    case (.value(let lhsValue), .value(let rhsValue)):
      return lhsValue == rhsValue
    default:
      return false
    }
  }
}

extension ValueOrUndefined: Comparable where InnerType: Comparable {
  public static func < (lhs: ValueOrUndefined, rhs: ValueOrUndefined) -> Bool {
    switch (lhs, rhs) {
    case (.undefined, .undefined):
      return false // undefined is considered equal to another undefined
    case (.undefined, _):
      return false
    case (_, .undefined):
      return false
    case (.value(let lhsValue), .value(let rhsValue)):
      return lhsValue < rhsValue
    }
  }
}

extension ValueOrUndefined {
  public static func ?? <T>(valueOrUndefined: consuming ValueOrUndefined<T>, defaultValue: @autoclosure () -> T) -> T {
    return valueOrUndefined.optional ?? defaultValue()
  }
}
