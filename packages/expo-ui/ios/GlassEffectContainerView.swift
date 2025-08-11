// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class GlassEffectContainerViewProps: ExpoSwiftUI.ViewProps {
  @Field var spacing: Double?
}

internal struct GlassEffectContainerView: ExpoSwiftUI.View {
  @ObservedObject var props: GlassEffectContainerViewProps

  var body: some View {
    if #available(iOS 26.0, macOS 17.0, *) {
      GlassEffectContainer(spacing: CGFloat(props.spacing ?? 0)) {
        Children()
      }
    } else {
      Children()
    }
  }
}
