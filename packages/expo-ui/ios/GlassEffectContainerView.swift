// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class GlassEffectContainerViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
  @Field var spacing: Double?
}

internal struct GlassEffectContainerView: ExpoSwiftUI.View {
  @ObservedObject var props: GlassEffectContainerViewProps

  var body: some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      GlassEffectContainer(spacing: CGFloat(props.spacing ?? 0.0)) {
        Children()
      }
      .modifier(CommonViewModifiers(props: props))
      #else
      Children()
      #endif
    } else {
      Children()
    }
  }
}
