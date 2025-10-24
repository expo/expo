// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RectangleViewProps: UIBaseViewProps {
}

internal struct RectangleView: ExpoSwiftUI.View {
  @ObservedObject var props: RectangleViewProps

  var body: some View {
    Rectangle()
  }
}
