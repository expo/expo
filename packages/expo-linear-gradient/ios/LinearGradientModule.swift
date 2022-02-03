// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore

public class LinearGradientModule: Module {
  public func definition() -> ModuleDefinition {
    name("ExpoLinearGradient")

    viewManager {
      view {
        LinearGradientView()
      }

      prop("colors") { (view: LinearGradientView, colors: [CGColor]) in
        view.gradientLayer.setColors(colors)
      }

      prop("startPoint") { (view: LinearGradientView, startPoint: CGPoint?) in
        view.gradientLayer.setStartPoint(startPoint)
      }

      prop("endPoint") { (view: LinearGradientView, endPoint: CGPoint?) in
        view.gradientLayer.setEndPoint(endPoint)
      }

      prop("locations") { (view: LinearGradientView, locations: [CGFloat]?) in
        view.gradientLayer.setLocations(locations)
      }
    }
  }
}
