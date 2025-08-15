// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ProgressVariant: String, Enumerable {
  case circular
  case linear
}

final class ProgressProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var variant: ProgressVariant = .circular
  @Field var progress: Double?
  @Field var color: Color?
}

struct ProgressView: ExpoSwiftUI.View {
  @ObservedObject var props: ProgressProps

  var body: some View {
    SwiftUI.ProgressView(value: props.progress)
      .tint(props.color)
      .modifier(CommonViewModifiers(props: props))
      .if(props.variant == .circular) {
        $0.progressViewStyle(.circular)
      }
      .if(props.variant == .linear) {
        $0.progressViewStyle(.linear)
      }
  }
}
