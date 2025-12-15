// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class CircleViewProps: UIBaseViewProps {
}

internal struct CircleView: ExpoSwiftUI.View {
  @ObservedObject var props: CircleViewProps

  var body: some View {
    Circle()
  }
}
