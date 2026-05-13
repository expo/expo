// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A converter associated with the specific app context that delegates value conversions to the dynamic type converters.
 */
public struct MainValueConverter: ~Copyable {
  // Safe to use unowned — the converter is a lazy property of AppContext, so AppContext always outlives it.
  unowned let appContext: AppContext

  /**
   Casts the given JavaScriptValue to a non-JS value.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @JavaScriptActor
  public func toNative(_ value: JavaScriptValue, _ type: AnyDynamicType) throws -> Any {
    return try type.cast(jsValue: value, appContext: appContext)
  }

  /**
   Casts the given JS values to non-JS values.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @JavaScriptActor
  public func toNative(_ values: borrowing JavaScriptValuesBuffer, _ types: [AnyDynamicType]) throws -> [Any] {
    return try values.map { value, index in
      let type = types[index]

      do {
        return try toNative(value, type)
      } catch {
        throw ArgumentCastException((index: index, type: type)).causedBy(error)
      }
    }
  }

  /**
   Converts the given value to the type compatible with JavaScript.
   */
  @JavaScriptActor
  public func toJS(_ value: Any, _ type: AnyDynamicType) throws -> JavaScriptValue {
    return try type.convertToJS(value, appContext: appContext)
  }

  /**
   `toJS` variant that targets a specific runtime. Useful for Worklet runtime conversions.
   */
  @JavaScriptActor
  public func toJS(_ value: Any, _ type: AnyDynamicType, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    return try type.convertToJS(value, appContext: appContext, in: runtime)
  }
}
