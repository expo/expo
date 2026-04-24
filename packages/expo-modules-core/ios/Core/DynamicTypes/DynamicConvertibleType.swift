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
    return jsValue.getAny()
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return try innerType.convert(from: value, appContext: appContext)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let directJSValue = try directJSValueIfPossible(value, appContext: appContext) {
      return directJSValue
    }
    let result = try innerType.convertResult(value, appContext: appContext)
    if let result = result as? JavaScriptValue {
      return result
    }
    if let result = result as? AnyArgument {
      return try type(of: result).getDynamicType().castToJS(result, appContext: appContext)
    }
    return try Conversions.unknownToJavaScriptValue(result, appContext: appContext)
  }

  func convertToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let value = value as? any Record {
      return try JavaScriptActor.assumeIsolated {
        try value.toJSValue(appContext: appContext)
      }
    }
    if let value = value as? any RecordJavaScriptValueConvertible {
      return try JavaScriptActor.assumeIsolated {
        try value.toJSValue(appContext: appContext)
      }
    }
    let result = Conversions.convertFunctionResult(value, appContext: appContext, dynamicType: self)
    return try castToJS(result, appContext: appContext)
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
}
