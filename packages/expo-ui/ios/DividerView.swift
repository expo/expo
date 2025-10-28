// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal class DividerProps: UIBaseViewProps {
}

internal struct DividerView: ExpoSwiftUI.View {
  @ObservedObject var props: DividerProps

  var body: some View {
    Divider()
  }
}
