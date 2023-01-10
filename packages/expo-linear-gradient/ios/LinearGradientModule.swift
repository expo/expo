// Copyright 2021-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesCore
import SwiftUI

public final class LinearGradientProps: ViewProps {
  @Field
  var colors: [Color] = []

  @Field
  var startPoint: UnitPoint = UnitPoint(x: 0.5, y: 0.0)

  @Field
  var endPoint: UnitPoint = UnitPoint(x: 0.5, y: 1.0)

  @Field
  var locations: [Double] = []
}

public class LinearGradientModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLinearGradient")

    View { (props: LinearGradientProps) in
      ZStack {
        LinearGradient(
          colors: props.colors,
          startPoint: props.startPoint,
          endPoint: props.endPoint
        )
        Text("SwiftUI in Expo 🔥")
          .font(.system(size: 30))
          .foregroundColor(.white)
      }
    }
  }
}
