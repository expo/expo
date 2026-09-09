import ExpoModulesCore

public class RouterScrollViewDetectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRouterScrollViewDetector")

    View(RouterScrollViewDetectorView.self) {
      Events("onScrollViewDetected")
    }
  }
}
