// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct LazyVStackViewProps {
  var spacing: CGFloat?
  var alignment: HorizontalAlignmentOptions?
}

@ExpoView<LazyVStackViewProps>
public struct LazyVStackView: View {
  @State private var crossAxisSize: CGFloat = 0

  public var body: some View {
    LazyVStack(
      alignment: props.alignment?.toHorizontalAlignment() ?? .center,
      spacing: props.spacing
    ) {
      children
    }
    .onGeometryChange(for: CGFloat.self, of: { $0.size.width }, action: { crossAxisSize = $0 })
    .environment(\.containerCrossAxisSize, crossAxisSize)
    .applyExpoUIViewProps(props.base, appContext: appContext)
  }
}
