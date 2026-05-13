// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class RoundedRectangleViewProps: UIBaseViewProps {
  @Field var cornerRadius: CGFloat = 0
}

public struct RoundedRectangleView: ExpoSwiftUI.View {
  @ObservedObject public var props: RoundedRectangleViewProps

  public init(props: RoundedRectangleViewProps) {
    self.props = props
  }

  public var body: some View {
    RoundedRectangle(cornerRadius: props.cornerRadius)
  }
}
