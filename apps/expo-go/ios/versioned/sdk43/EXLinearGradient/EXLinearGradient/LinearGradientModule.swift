import ABI43_0_0ExpoModulesCore

public class LinearGradientModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoLinearGradient")

    viewManager {
      view {
        ABI43_0_0EXLinearGradient()
      }

      prop("colors") { (view: ABI43_0_0EXLinearGradient, colors: [Int]) in
        view.setColors(colors)
      }

      prop("startPoint") { (view: ABI43_0_0EXLinearGradient, startPoint: [Double]) in
        view.setStart(CGPoint(x: startPoint[0], y: startPoint[1]))
      }

      prop("endPoint") { (view: ABI43_0_0EXLinearGradient, endPoint: [Double]) in
        view.setEnd(CGPoint(x: endPoint[0], y: endPoint[1]))
      }

      prop("locations") { (view: ABI43_0_0EXLinearGradient, locations: [Double]) in
        view.setLocations(locations)
      }
    }
  }
}
