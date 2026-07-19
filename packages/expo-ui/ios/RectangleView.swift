// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class RectangleViewProps: UIBaseViewProps {}

public struct RectangleView: ExpoSwiftUI.View {
  @ObservedObject public var props: RectangleViewProps

  public init(props: RectangleViewProps) {
    self.props = props
  }

  public var body: some View {
    Rectangle()
  }
}
