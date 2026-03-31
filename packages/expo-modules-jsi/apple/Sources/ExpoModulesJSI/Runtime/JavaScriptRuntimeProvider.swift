import Foundation

internal import jsi

@objc(JavaScriptRuntimeProvider)
public class JavaScriptRuntimeProvider: NSObject {
  internal var runtime: facebook.jsi.Runtime?

  internal init(runtime: facebook.jsi.Runtime) {
    self.runtime = runtime
  }

  internal func consume() -> facebook.jsi.Runtime {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    defer {
      self.runtime = nil
    }
    return runtime
  }
}
