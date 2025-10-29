// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class EllipseViewProps: UIBaseViewProps {
}

internal struct EllipseView: ExpoSwiftUI.View {
  @ObservedObject var props: EllipseViewProps

  var body: some View {
    Ellipse()
  }
}
