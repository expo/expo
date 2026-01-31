internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptError: JavaScriptType, ~Copyable {
  private weak var runtime: JavaScriptRuntime?
  nonisolated(unsafe) private let pointee: facebook.jsi.JSError

  internal init(_ runtime: JavaScriptRuntime, _ error: facebook.jsi.JSError) {
    self.runtime = runtime
    self.pointee = error
  }

  public init(_ runtime: JavaScriptRuntime, message: String) {
    self.runtime = runtime
    self.pointee = facebook.jsi.JSError(runtime.pointee, message)
  }

  public func asValue() -> JavaScriptValue {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return JavaScriptValue(runtime, expo.valueFromError(runtime.pointee, pointee))
  }
}

public struct ScriptEvaluationError: Error {
  var message: String
}

// MARK: - JSRepresentable

extension JavaScriptError: JSRepresentable {
  public static func fromJSValue(_ value: borrowing JavaScriptValue) -> JavaScriptError {
    fatalError("Unimplemented")
  }

  public func toJSValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptError: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.Runtime) -> JavaScriptError {
    fatalError("Unimplemented")
  }

  func toJSIValue(in runtime: facebook.jsi.Runtime) -> facebook.jsi.Value {
    return asValue().pointee
  }
}

extension expo.CppError: Error {
  /**
   The error message describing what went wrong.
   */
  public var message: String {
    return String(_message)
  }
}
