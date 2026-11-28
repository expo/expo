// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct LazyHStackViewProps {
  var spacing: CGFloat?
  var alignment: VerticalAlignmentOptions?
}

@ExpoView<LazyHStackViewProps>
public struct LazyHStackView: View {
  @State private var crossAxisSize: CGFloat = 0

  public var body: some View {
    LazyHStack(
      alignment: props.alignment?.toVerticalAlignment() ?? .center,
      spacing: props.spacing
    ) {
      children
    }
    .onGeometryChange(for: CGFloat.self, of: { $0.size.height }, action: { crossAxisSize = $0 })
    .environment(\.containerCrossAxisSize, crossAxisSize)
    .applyExpoUIViewProps(props.base, appContext: appContext)
  }
}
