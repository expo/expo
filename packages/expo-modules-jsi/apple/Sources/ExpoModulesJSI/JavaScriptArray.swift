internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptArray: JavaScriptType, ~Copyable {
  internal weak var runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.Array

  internal init(runtime: JavaScriptRuntime, pointee: consuming facebook.jsi.Array) {
    self.runtime = runtime
    self.pointee = pointee
  }

  public var size: Int {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return pointee.size(runtime.pointee)
  }

  public func getValue(atIndex index: Int) -> JavaScriptValue {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return JavaScriptValue(runtime, pointee.getValueAtIndex(runtime.pointee, index))
  }

  public func map<U>(_ transform: (_ value: borrowing JavaScriptValue) throws -> U) rethrows -> [U] {
    return try (0..<size).map { index in
      let value = self.getValue(atIndex: index)
      return try transform(value)
    }
  }

  public func asValue() -> JavaScriptValue {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return JavaScriptValue(runtime, expo.valueFromArray(runtime.pointee, pointee))
  }
}
