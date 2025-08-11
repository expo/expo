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
  @Field var animatedValue: String?
}

internal struct GlassEffectContainerView: ExpoSwiftUI.View {
  
  @ObservedObject var props: GlassEffectContainerViewProps
  @Namespace private var ns

  var body: some View {
    if #available(iOS 26.0, macOS 17.0, *) {
      GlassEffectContainer(spacing: CGFloat(props.spacing ?? 0.0)) {
        Children()
      }
      .modifier(CommonViewModifiers(props: props))
      .environment(\.glassNamespace, ns)
      .environment(\.animationValue, props.animatedValue)
    } else {
      Children()
    }
  }
}
