// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class ScrollViewComponentProps: UIBaseViewProps {
  @Field var axes: AxisOptions = .vertical
  @Field var scrollIndicators: ScrollIndicatorVisibilityOptions = .automatic
}

public struct ScrollViewComponent: ExpoSwiftUI.View {
  @ObservedObject public var props: ScrollViewComponentProps

  public init(props: ScrollViewComponentProps) {
    self.props = props
  }

  public var body: some View {
    ScrollView(props.axes.toAxis()) {
      Children()
    }
    .scrollIndicators(props.scrollIndicators.toVisibility())
  }
}
