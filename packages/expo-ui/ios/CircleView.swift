// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class CircleViewProps: UIBaseViewProps {}

public struct CircleView: ExpoSwiftUI.View {
  @ObservedObject public var props: CircleViewProps

  public init(props: CircleViewProps) {
    self.props = props
  }

  public var body: some View {
    Circle()
  }
}
