// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type that wraps any type conforming to `Convertible` protocol.
 */
internal struct DynamicConvertibleType: AnyDynamicType {
  let innerType: Convertible.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let convertibleType = type as? Self {
      return convertibleType.innerType == innerType
    }
    return false
  }

  @JavaScriptActor
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if let recordType = innerType as? any Record.Type {
      let record = recordType.init()
      try record.update(withObject: try jsValue.asObject(), appContext: appContext)
      return record
    }
    return try innerType.convert(from: jsValue.getAny(), appContext: appContext)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return try innerType.convert(from: value, appContext: appContext)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let directJSValue = try directJSValueIfPossible(value, appContext: appContext) {
      return directJSValue
    }
    if let jsValue = value as? JavaScriptValue {
      return jsValue
    }
    if value is AnyArgument {
      return try convertOriginalValueToJS(value, appContext: appContext)
    }
    return try serializeConvertedValue(value, appContext: appContext)
  }

  func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let directJSValue = try directJSValueIfPossible(value, appContext: appContext) {
      return directJSValue
    }
    return try convertOriginalValueToJS(value, appContext: appContext)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    return try innerType.convertResult(result, appContext: appContext)
  }

  var description: String {
    String(describing: innerType.self)
  }

  private func directJSValueIfPossible<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue? {
    if let value = value as? any Record {
      return try JavaScriptActor.assumeIsolated {
        try value.toJSValue(appContext: appContext)
      }
    }
    // `FormattedRecord` isn't a `Record`, so it needs this separate branch to preserve the direct path.
    if let value = value as? any RecordJavaScriptValueConvertible {
      return try JavaScriptActor.assumeIsolated {
        try value.toJSValue(appContext: appContext)
      }
    }
    return nil
  }

  private func convertOriginalValueToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    let result = try innerType.convertResult(value, appContext: appContext)
    return try serializeConvertedValue(result, appContext: appContext)
  }

  private func serializeConvertedValue(_ value: Any, appContext: AppContext) throws -> JavaScriptValue {
    if let result = value as? JavaScriptValue {
      return result
    }
    if let result = value as? AnyArgument {
      return try type(of: result).getDynamicType().castToJS(result, appContext: appContext)
    }
    return try Conversions.unknownToJavaScriptValue(value, appContext: appContext)
  }
}
