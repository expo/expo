internal import jsi

// MARK: - JavaScriptRepresentable

/// A type whose values can be represented in the JS runtime.
public protocol JavaScriptRepresentable: Sendable, ~Copyable {
  /// Creates an instance of this type from the given JS value.
  static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self
  /// Creates a JS value representing this value in the given runtime.
  func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue
}

extension Optional: JavaScriptRepresentable where Wrapped: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self {
    if value.isNull() || value.isUndefined() {
      return nil
    }
    return Wrapped.fromJavaScriptValue(value)
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    guard let self else {
      return .null
    }
    return self.toJavaScriptValue(in: runtime)
  }
}

extension Array: JavaScriptRepresentable where Element: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self {
    return value.getArray().map { Element.fromJavaScriptValue($0) }
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    let values = map { $0.toJavaScriptValue(in: runtime) }
    return JavaScriptArray(runtime, items: values).asValue()
  }
}

extension Dictionary: JavaScriptRepresentable where Key == String, Value: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self {
    guard let runtime = value.runtime else {
      FatalError.runtimeLost()
    }
    let jsiRuntime = runtime.pointee
    let object = value.pointee.getObject(jsiRuntime)
    let propertyNames = object.getPropertyNames(jsiRuntime)
    let size = propertyNames.size(jsiRuntime)
    var result: Self = [:]

    result.reserveCapacity(size)

    for index in 0..<size {
      // Look the value up by the key string the engine handed back instead of re-encoding the Swift
      // key: it skips one engine string allocation per entry and round-trips any name exactly.
      let jsiKey = propertyNames.getValueAtIndex(jsiRuntime, index).getString(jsiRuntime)
      let jsiValue = JavaScriptValue(runtime, object.getProperty(jsiRuntime, jsiKey))
      result[String(jsiString: jsiKey, in: jsiRuntime)] = Value.fromJavaScriptValue(jsiValue)
    }
    return result
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    let object = JavaScriptObject(runtime)

    for (key, value) in self {
      object.setProperty(key, value: value.toJavaScriptValue(in: runtime))
    }
    return object.asValue()
  }
}
