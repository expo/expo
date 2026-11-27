// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct GlassEffectContainerViewProps {
  var spacing: CGFloat?
}

@ExpoView<GlassEffectContainerViewProps>
public struct GlassEffectContainerView: View {
  public var body: some View {
    container.applyExpoUIViewProps(props.base, appContext: appContext)
  }

  @ViewBuilder
  private var container: some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
      GlassEffectContainer(spacing: props.spacing) {
        children
      }
#else
      children
#endif
    } else {
      children
    }
  }
}
