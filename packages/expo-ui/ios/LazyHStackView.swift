// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class LazyHStackViewProps: UIBaseViewProps {
  @Field var spacing: Double?
  @Field var alignment: VerticalAlignmentOptions?
}

public struct LazyHStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: LazyHStackViewProps
  @State private var crossAxisSize: CGFloat = 0

  public init(props: LazyHStackViewProps) {
    self.props = props
  }

  public var body: some View {
    LazyHStack(
      alignment: props.alignment?.toVerticalAlignment() ?? .center,
      spacing: props.spacing.map { CGFloat($0) }) {
        Children()
    }
    .onGeometryChange(for: CGFloat.self, of: { $0.size.height }, action: { crossAxisSize = $0 })
    .environment(\.containerCrossAxisSize, crossAxisSize)
  }
}
