// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

struct MeshGradientView: ExpoSwiftUI.View {
  @EnvironmentObject var props: MeshGradientProps

  var body: some View {
    ZStack(alignment: .topLeading) {
      let gradient = if #available(iOS 18.0, *) {
        AnyView(
          MeshGradient(
            width: props.columns,
            height: props.rows,
            points: props.points,
            colors: props.colors,
            smoothsColors: props.smoothsColors
          )
          .ignoresSafeArea(edges: props.ignoresSafeArea ? .all : [])
        )
      } else {
        AnyView(EmptyView())
      }

      if props.mask {
        gradient.mask(alignment: .topLeading) {
          Children()
        }
      } else {
        Group {
          gradient
          Children()
        }
      }
    }
  }
}
