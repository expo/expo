// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class LazyVStackViewProps: UIBaseViewProps {
  @Field var spacing: Double?
  @Field var alignment: HorizontalAlignmentOptions?
}

public struct LazyVStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: LazyVStackViewProps

  public init(props: LazyVStackViewProps) {
    self.props = props
  }

  public var body: some View {
    GeometryReader { geometry in
      LazyVStack(
        alignment: props.alignment?.toHorizontalAlignment() ?? .center,
        spacing: CGFloat(props.spacing ?? 0)) {
          Children()
      }
      .frame(height: geometry.size.height)
    }
  }
}
