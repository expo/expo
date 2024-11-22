// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class MeshGradientProps: ExpoSwiftUI.ViewProps {
  @Field var columns: Int = 0
  @Field var rows: Int = 0
  @Field var points: [SIMD2<Float>] = []
  @Field var colors: [Color] = []
  @Field var smoothsColors: Bool = true
  @Field var ignoresSafeArea: Bool = true
}
