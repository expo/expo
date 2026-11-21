// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func rotation3DEffectModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let angle: Double = try p.value("angle", 0)
  let axisX: CGFloat = try p.value("axisX", 0)
  let axisY: CGFloat = try p.value("axisY", 0)
  let axisZ: CGFloat = try p.value("axisZ", 0)
  let perspective: CGFloat = try p.value("perspective", 1)
  content.rotation3DEffect(
    .degrees(angle),
    axis: (x: axisX, y: axisY, z: axisZ),
    perspective: perspective
  )
}
