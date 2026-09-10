// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class NavigationStackViewProps: UIBaseViewProps {}

internal struct NavigationStackView: ExpoSwiftUI.View {
  @ObservedObject var props: NavigationStackViewProps

  init(props: NavigationStackViewProps) {
    self.props = props
  }

  var body: some View {
    NavigationStack {
      Children()
    }
  }
}
