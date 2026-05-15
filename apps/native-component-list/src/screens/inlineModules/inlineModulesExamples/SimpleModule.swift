internal import ExpoModulesCore
import WebKit

class SimpleModule: Module {
  public func definition() -> ModuleDefinition {
    Constant("test") {
      return "Swift constant 1283"
    }
  }
}
