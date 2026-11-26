// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class UnevenRoundedRectangleViewProps: UIBaseViewProps {
  @Field var topLeadingRadius: CGFloat = 0
  @Field var topTrailingRadius: CGFloat = 0
  @Field var bottomLeadingRadius: CGFloat = 0
  @Field var bottomTrailingRadius: CGFloat = 0
}

public struct UnevenRoundedRectangleView: ExpoSwiftUI.View {
  @ObservedObject public var props: UnevenRoundedRectangleViewProps

  public init(props: UnevenRoundedRectangleViewProps) {
    self.props = props
  }

  public var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      UnevenRoundedRectangle(
        topLeadingRadius: props.topLeadingRadius,
        bottomLeadingRadius: props.bottomLeadingRadius,
        bottomTrailingRadius: props.bottomTrailingRadius,
        topTrailingRadius: props.topTrailingRadius
      )
    } else {
      EmptyView()
    }
  }
}
