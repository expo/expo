import ExpoModulesCore

public class LinearGradientModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoLinearGradient")

    viewManager {
      view {
        EXLinearGradient()
      }

      prop("colors") { (view: EXLinearGradient, colors: [Int]) in
        view.setColors(colors)
      }

      prop("startPoint") { (view: EXLinearGradient, startPoint: [Double]) in
        view.setStart(CGPoint(x: startPoint[0], y: startPoint[1]))
      }

      prop("endPoint") { (view: EXLinearGradient, endPoint: [Double]) in
        view.setEnd(CGPoint(x: endPoint[0], y: endPoint[1]))
      }

      prop("locations") { (view: EXLinearGradient, locations: [Double]) in
        view.setLocations(locations)
      }
    }
  }
}
