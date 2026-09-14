// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class NavigationLinkViewProps: UIBaseViewProps {
  @Field var value: String = ""
}

internal struct NavigationLinkView: ExpoSwiftUI.View {
  @ObservedObject var props: NavigationLinkViewProps

  init(props: NavigationLinkViewProps) {
    self.props = props
  }

  var body: some View {
    NavigationLink(value: props.value) {
      Children()
    }
  }
}
