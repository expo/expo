// Copyright 2021-present 650 Industries. All rights reserved.

protocol AnyValueOrUndefined: AnyArgument {}

public enum ValueOrUndefined<InnerType: AnyArgument>: AnyValueOrUndefined {
  public static func getDynamicType() -> any AnyDynamicType {
    return DynamicValueOrUndefinedType<InnerType>()
  }

  case undefined
  case value(unwrapped: InnerType)

  var optional: InnerType? {
    return switch self {
    // We want to produce Optional(nil) instead of nil - that's what DynamicOptionalType does
    case .undefined: Any??.some(nil) as Any?? as! InnerType?
    case .value(let value): value
    }
  }

  var isUndefined: Bool {
    return switch self {
    case .undefined: true
    default: false
    }
  }

  // @deprecated because of the typo
  var isUndefinded: Bool {
    return self.isUndefined
  }
}

extension ValueOrUndefined: Equatable where InnerType: Equatable {
  public static func == (lhs: ValueOrUndefined, rhs: ValueOrUndefined) -> Bool {
    return switch (lhs, rhs) {
    case (.undefined, .undefined):
      true
    case (.value(let lhsValue), .value(let rhsValue)):
      lhsValue == rhsValue
    default:
      false
    }
  }
}

extension ValueOrUndefined: Comparable where InnerType: Comparable {
  public static func < (lhs: ValueOrUndefined, rhs: ValueOrUndefined) -> Bool {
    return switch (lhs, rhs) {
    case (.undefined, .undefined):
      false // undefined is considered equal to another undefined
    case (.undefined, _):
      false
    case (_, .undefined):
      false
    case (.value(let lhsValue), .value(let rhsValue)):
      lhsValue < rhsValue
    }
  }
}

extension ValueOrUndefined {
  public static func ?? <T>(valueOrUndefined: consuming ValueOrUndefined<T>, defaultValue: @autoclosure () -> T) -> T {
    return valueOrUndefined.optional ?? defaultValue()
  }
}
