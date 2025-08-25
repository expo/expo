import ExpoModulesCore

public class BottomAccessoryNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterBottomAccessory")

    View(BottomAccessoryNativeView.self) {
    }
  }
}
