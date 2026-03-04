// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct Rotation3DEffectModifier: ViewModifier, Record {
  @Field var angle: Double = 0
  @Field var axisX: CGFloat = 0
  @Field var axisY: CGFloat = 0
  @Field var axisZ: CGFloat = 0
  @Field var perspective: CGFloat = 1

  func body(content: Content) -> some View {
    content.rotation3DEffect(
      .degrees(angle),
      axis: (x: axisX, y: axisY, z: axisZ),
      perspective: perspective
    )
  }
}
