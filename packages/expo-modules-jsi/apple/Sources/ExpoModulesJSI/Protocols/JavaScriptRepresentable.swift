internal import jsi

// MARK: - JavaScriptRepresentable

/**
 A type whose values can be represented in the JS runtime.
 */
public protocol JavaScriptRepresentable: Sendable, ~Copyable {
  /**
   Creates an instance of this type from the given JS value.
   */
  static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self
  /**
   Creates a JS value representing this value in the given runtime.
   */
  func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue
}

public extension JavaScriptRepresentable {
  static func fromJavaScriptValue(_ value: JavaScriptValue) -> Self {
    guard let jsiRuntime = value.runtime else {
      FatalError.runtimeLost()
    }
    if let JSIRepresentableType = Self.self as? JSIRepresentable.Type {
      return JSIRepresentableType.fromJSIValue(value.pointee, in: jsiRuntime.pointee) as! Self
    }
    FatalError.unimplemented()
  }

  func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    if let self = self as? JSIRepresentable {
      return JavaScriptValue(runtime, self.toJSIValue(in: runtime.pointee))
    }
    FatalError.unimplemented()
  }
}

extension Optional: JavaScriptRepresentable where Wrapped: JavaScriptRepresentable {}
extension Array: JavaScriptRepresentable where Element: JavaScriptRepresentable {}
extension Dictionary: JavaScriptRepresentable where Key == String, Value: JavaScriptRepresentable {}
