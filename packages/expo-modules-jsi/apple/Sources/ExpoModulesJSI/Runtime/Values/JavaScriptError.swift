internal import ExpoModulesJSI_Cxx
internal import jsi

/// A Swift `Error` wrapping a JavaScript exception, used to throw to and from the JS world.
///
/// It can carry either a freshly created JS `Error` (from a message or a `JavaScriptThrowable`) or
/// an arbitrary thrown JS value, since JavaScript allows throwing any value, not only an `Error`
/// instance. When thrown out of a host function or used to reject a promise, the wrapped value
/// reaches JavaScript unchanged, preserving its identity.
///
/// - Important: The wrapped value is tied to its runtime and the JavaScript thread. As an `Error`
///   it may be caught on any thread, but reading its value or releasing it should happen on the
///   JavaScript thread while the runtime is alive.
public final class JavaScriptError: Error, Sendable {
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

  /// Creates a JavaScript error referring to an arbitrary JS value. Unlike the message-based
  /// initializers, this does not mint a new `Error` instance: the value is thrown as-is, which
  /// matches JavaScript semantics where any value (not only an `Error`) can be thrown.
  public init(_ runtime: JavaScriptRuntime, value: borrowing JavaScriptValue) {
    self.runtime = runtime
    // The underlying `jsi::Value` is copied because `JavaScriptValue` is a reference type that may
    // be aliased. Once it becomes non-copyable, switch to `consuming` and move `pointee` straight
    // into the error to avoid this copy.
    self.pointee = expo.errorFromValue(runtime.pointee, facebook.jsi.Value(runtime.pointee, value.pointee))
  }

  /// Creates a JavaScript error from a native error conforming to `JavaScriptThrowable`.
  /// Creates a proper JavaScript `Error` instance with `message` set, then attaches
  /// the optional `code` property to the error object.
  public init(_ runtime: JavaScriptRuntime, from error: any JavaScriptThrowable) {
    self.runtime = runtime
    self.pointee = facebook.jsi.JSError(runtime.pointee, error.message)

    // Attach the code property to the Error object when provided.
    if !error.code.isEmpty {
      let errorObject = JavaScriptValue(runtime, expo.valueFromError(runtime.pointee, pointee)).getObject()
      errorObject.setProperty("code", value: error.code)
    }
  }

  /// Returns the `JavaScriptError` representing an arbitrary native error. An existing
  /// `JavaScriptError` is returned unchanged so its wrapped value reaches JS as-is; a
  /// `JavaScriptThrowable` is routed through the code-preserving initializer above; any
  /// other error is stringified into a generic `Error`.
  @inlinable
  public static func from(_ error: any Error, in runtime: JavaScriptRuntime) -> JavaScriptError {
    if let jsError = error as? JavaScriptError {
      return jsError
    }
    if let throwable = error as? JavaScriptThrowable {
      return JavaScriptError(runtime, from: throwable)
    }
    return JavaScriptError(runtime, message: String(describing: error))
  }

  /// Returns the error as a `JavaScriptValue`, which may be an arbitrary value rather than an
  /// `Error` instance when the error was created from one.
  public func toValue() -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, expo.valueFromError(runtime.pointee, pointee))
  }

  internal func toJSError() -> facebook.jsi.JSError {
    return pointee
  }
}

public struct ScriptEvaluationError: Error {
  public var message: String
}

/// Makes `expo.CppError` conform to Swift's `Error` protocol so it can be caught
/// with `try/catch`, and exposes its message as a native Swift `String`.
///
/// The C++ `message` field is bridged to Swift as `_message` (a `std.string`)
/// via the `SWIFT_NAME(_message)` annotation in `CppError.h`. This extension
/// wraps it in a Swift `String` for cleaner call-site usage.
extension expo.CppError: Error {
  public var message: String {
    return String(_getMessage())
  }
}
