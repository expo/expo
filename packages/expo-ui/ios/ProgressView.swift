// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ProgressVariant: String, Enumerable {
  case circular
  case linear
}

class ProgressProps: ExpoSwiftUI.ViewProps {
  @Field var variant: ProgressVariant = .circular
  @Field var progress: Double?
  @Field var color: Color?
}

struct ProgressView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ProgressProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy

  var body: some View {
    ExpoSwiftUI.AutoSizingStack(
      shadowNodeProxy: shadowNodeProxy,
      axis: props.variant == .circular ? .both : .vertical
    ) {
      SwiftUI.ProgressView(value: props.progress)
        .tint(props.color)
        .if(props.variant == .circular) {
          $0.progressViewStyle(.circular)
        }
        .if(props.variant == .linear) {
          $0.progressViewStyle(.linear)
        }
    }
  }
}
