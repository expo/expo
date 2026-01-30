// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A converter associated with the specific app context that delegates value conversions to the dynamic type converters.
 */
public struct MainValueConverter {
  private(set) weak var appContext: AppContext?

  /**
   Casts the given JavaScriptValue to a non-JS value.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @JavaScriptActor
  public func toNative(_ value: borrowing JavaScriptValue, _ type: AnyDynamicType) throws -> Any {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    let rawValue = try type.cast(jsValue: value, appContext: appContext)
    return try type.cast(rawValue, appContext: appContext)
  }

  /**
   Casts the given JS values to non-JS values.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @JavaScriptActor
  public func toNative(_ values: borrowing JSValuesBuffer, _ types: [AnyDynamicType]) throws -> [Any] {
    return try values.map { value, index in
      let type = types[index]

      do {
        return try toNative(value.copy(), type)
      } catch {
        throw ArgumentCastException((index: index - 1, type: type)).causedBy(error)
      }
    }
  }

  /**
   Converts the given value to the type compatible with JavaScript.
   */
  public func toJS(_ value: Any?, _ type: AnyDynamicType) throws -> JavaScriptValue {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    guard let value, !(value is Void) else {
      return .undefined()
    }
    let result = Conversions.convertFunctionResult(value, appContext: appContext, dynamicType: type)
    return try type.castToJS(result, appContext: appContext)
  }
}
