// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ButtonPopoverViewProps: ExpoSwiftUI.ViewProps {}

internal struct ButtonPopoverView: ExpoSwiftUI.View {
  @ObservedObject var props: ButtonPopoverViewProps

  var body: some View {
    Children()
  }
}
