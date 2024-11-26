// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct MeshGradientView: ExpoSwiftUI.View {
  @EnvironmentObject var props: MeshGradientProps

  var body: some View {
    if #available(iOS 18.0, *) {
      MeshGradient(
        width: props.columns,
        height: props.rows,
        points: props.points,
        colors: props.colors,
        smoothsColors: props.smoothsColors
      )
      .ignoresSafeArea(edges: props.ignoresSafeArea ? .all : [])
    } else {
      EmptyView()
    }
  }
}
