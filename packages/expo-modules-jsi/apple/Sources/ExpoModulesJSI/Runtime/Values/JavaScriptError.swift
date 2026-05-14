internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptError: JavaScriptType, ~Copyable {
  private weak let runtime: JavaScriptRuntime?
  nonisolated(unsafe) private let pointee: facebook.jsi.JSError

  internal init(_ runtime: JavaScriptRuntime, _ error: facebook.jsi.JSError) {
    self.runtime = runtime
    self.pointee = error
  }

  public init(_ runtime: JavaScriptRuntime, message: String) {
    self.runtime = runtime
    self.pointee = facebook.jsi.JSError(runtime.pointee, message)
  }

  /**
   Creates a JavaScript error from a native error conforming to `JavaScriptThrowable`.
   Creates a proper JavaScript `Error` instance with `message` set, then attaches
   the optional `code` property to the error object.
   */
  public init(_ runtime: JavaScriptRuntime, from error: any JavaScriptThrowable) {
    self.runtime = runtime
    self.pointee = facebook.jsi.JSError(runtime.pointee, error.message)

    // Attach the code property to the Error object when provided.
    if !error.code.isEmpty {
      let errorObject = JavaScriptValue(runtime, expo.valueFromError(runtime.pointee, pointee)).getObject()
      errorObject.setProperty("code", value: error.code)
    }
  }

  public func asValue() -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, expo.valueFromError(runtime.pointee, pointee))
  }

  internal func asJSIValue() -> facebook.jsi.Value {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return expo.valueFromError(runtime.pointee, pointee)
  }

  internal func toJSError() -> facebook.jsi.JSError {
    return pointee
  }
}

public struct ScriptEvaluationError: Error {
  public var message: String
}

// MARK: - JavaScriptRepresentable

extension JavaScriptError: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: JavaScriptValue) -> JavaScriptError {
    FatalError.unimplemented()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptError: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> JavaScriptError {
    FatalError.unimplemented()
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}

/**
 Makes `expo.CppError` conform to Swift's `Error` protocol so it can be caught
 with `try/catch`, and exposes its message as a native Swift `String`.

 The C++ `message` field is bridged to Swift as `_message` (a `std.string`)
 via the `SWIFT_NAME(_message)` annotation in `CppError.h`. This extension
 wraps it in a Swift `String` for cleaner call-site usage.
 */
extension expo.CppError: Error {
  public var message: String {
    return String(_getMessage())
  }
}
