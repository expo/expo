// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class GlassEffectContainerViewProps: UIBaseViewProps {
  @Field var spacing: Double?
}

public struct GlassEffectContainerView: ExpoSwiftUI.View {
  @ObservedObject public var props: GlassEffectContainerViewProps

  public init(props: GlassEffectContainerViewProps) {
    self.props = props
  }

  public var body: some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
      GlassEffectContainer(spacing: CGFloat(props.spacing ?? 0.0)) {
        Children()
      }
#else
      Children()
#endif
    } else {
      Children()
    }
  }
}
