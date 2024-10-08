// Copyright 2024-present 650 Industries. All rights reserved.

internal struct DynamicStringType: AnyDynamicType {
  static let shared = DynamicStringType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == String.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let string = value as? String {
      return string
    }
    throw Conversions.CastingException<String>(value)
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.kind == .string {
      return jsValue.getString()
    }
    throw Conversions.ConversionToNativeFailedException((kind: jsValue.kind, nativeType: String.self))
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let string = value as? String {
      return .string(string, runtime: try appContext.runtime)
    }
    throw Conversions.ConversionToJSFailedException((kind: .string, nativeType: ValueType.self))
  }

  var description: String {
    "String"
  }
}
