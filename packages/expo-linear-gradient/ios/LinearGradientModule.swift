// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore

public class LinearGradientModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLinearGradient")

    View(LinearGradientView.self) {
      Prop("colors") { (view: LinearGradientView, colors: [UIColor]) in
        view.gradientLayer.setColors(colors)
      }

      Prop("startPoint") { (view: LinearGradientView, startPoint: CGPoint?) in
        view.gradientLayer.setStartPoint(startPoint)
      }

      Prop("endPoint") { (view: LinearGradientView, endPoint: CGPoint?) in
        view.gradientLayer.setEndPoint(endPoint)
      }

      Prop("locations") { (view: LinearGradientView, locations: [CGFloat]?) in
        view.gradientLayer.setLocations(locations)
      }
    }
  }
}
