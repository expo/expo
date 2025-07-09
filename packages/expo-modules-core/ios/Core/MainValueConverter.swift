// Copyright 2024-present 650 Industries. All rights reserved.

/**
 A converter associated with the specific app context that delegates value conversions to the dynamic type converters.
 */
public struct MainValueConverter {
  private(set) weak var appContext: AppContext?

  /**
   Casts the given JavaScriptValue to a non-JS value.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  public func toNative(_ value: JavaScriptValue, _ type: AnyDynamicType) throws -> Any {
    // Preliminary cast from JS value to a common native type.
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    let rawValue = try type.cast(jsValue: value, appContext: appContext)

    // Cast common native type to more complex types (e.g. records, convertibles, enumerables, shared objects).
    return try type.cast(rawValue, appContext: appContext)
  }

  /**
   Casts the given JS values to non-JS values.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  public func toNative(_ values: [JavaScriptValue], _ types: [AnyDynamicType]) throws -> [Any] {
    // While using `values.enumerated().map` sounds like a more straightforward approach,
    // this code seems quite critical for performance and using a standard `map` performs much better.
    var index = 0

    return try values.map { value in
      let type = types[index]
      index += 1

      do {
        return try toNative(value, type)
      } catch {
        throw ArgumentCastException((index: index - 1, type: type)).causedBy(error)
      }
    }
  }

  /**
   Converts the given value to the type compatible with JavaScript.
   */
  public func toJS<ValueType>(_ value: ValueType, _ type: AnyDynamicType) throws -> JavaScriptValue {
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }
    let result = Conversions.convertFunctionResult(value, appContext: appContext, dynamicType: type)
    return try type.castToJS(result, appContext: appContext)
  }
}
