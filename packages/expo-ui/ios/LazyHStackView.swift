// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class LazyHStackViewProps: UIBaseViewProps {
  @Field var spacing: Double?
  @Field var alignment: VerticalAlignmentOptions?
}

public struct LazyHStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: LazyHStackViewProps

  public init(props: LazyHStackViewProps) {
    self.props = props
  }

  public var body: some View {
    LazyHStack(
      alignment: props.alignment?.toVerticalAlignment() ?? .center,
      spacing: props.spacing.map { CGFloat($0) }) {
        Children()
    }
  }
}
