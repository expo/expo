// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal struct DynamicNumberType<NumberType>: AnyDynamicType {
  let numberType: NumberType.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == numberType
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.isNumber() {
      // Fast paths for common types avoid expensive `as? any BinaryFloatingPoint` conformance lookups.
      let double = jsValue.getDouble()
      if NumberType.self == Double.self {
        return double
      }
      if NumberType.self == Int.self {
        return Int(double.rounded())
      }
      if NumberType.self == Float.self {
        return Float(double)
      }
      if let FloatingPointType = NumberType.self as? any BinaryFloatingPoint.Type {
        return FloatingPointType.init(double)
      }
      if let IntegerType = NumberType.self as? any BinaryInteger.Type {
        return IntegerType.init(double.rounded())
      }
    }
    throw Conversions.ConversionToNativeFailedException((kind: jsValue.kind, nativeType: numberType))
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let number = value as? NumberType {
      return number
    }
    if let number = value as? Double, NumberType.self is Float32.Type {
      // double -> float
      return Float32.init(number)
    }
    if let number = value as? any BinaryInteger {
      if let IntegerType = NumberType.self as? any BinaryInteger.Type {
        // integer -> another integer
        return IntegerType.init(number)
      }
      if let FloatingPointType = NumberType.self as? any BinaryFloatingPoint.Type {
        // integer -> float
        return FloatingPointType.init(number)
      }
    }
    if let number = value as? any BinaryFloatingPoint {
      if let FloatingPointType = NumberType.self as? any BinaryFloatingPoint.Type {
        // float -> another float
        return FloatingPointType.init(number)
      }
      if let IntegerType = NumberType.self as? any BinaryInteger.Type {
        // float -> integer (schoolbook rounding)
        return IntegerType.init(number.rounded())
      }
    }
    throw Conversions.CastingException<NumberType>(value)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    // Fast paths for common types avoid expensive `as? any BinaryFloatingPoint` conformance lookups.
    if let value = value as? Double {
      return .number(value)
    }
    if let value = value as? Int {
      return .number(Double(value))
    }
    if let value = value as? Float {
      return .number(Double(value))
    }
    if let value = value as? any BinaryFloatingPoint {
      return .number(Double(value))
    }
    if let value = value as? any BinaryInteger {
      return .number(Double(value))
    }
    throw Conversions.ConversionToJSFailedException((kind: .number, nativeType: ValueType.self))
  }

  var description: String {
    "\(numberType)"
  }
}
