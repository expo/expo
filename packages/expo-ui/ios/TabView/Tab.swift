// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class TabProps: UIBaseViewProps {
  @Field var value: String
  @Field var label: String?
  @Field var systemImage: String?
}

// Marker view whose props are read by the enclosing TabView to build
// SwiftUI.Tab on iOS 18+. Falls back to .tabItem on iOS 17.
internal struct Tab: ExpoSwiftUI.View {
  @ObservedObject var props: TabProps

  init(props: TabProps) {
    self.props = props
  }

  // iOS 17 fallback — on iOS 18+ the parent reads props directly.
  var body: some View {
    Children()
      .tabItem {
        if let label = props.label, let systemImage = props.systemImage {
          Label(label, systemImage: systemImage)
        } else if let label = props.label {
          Text(label)
        } else if let systemImage = props.systemImage {
          Image(systemName: systemImage)
        }
      }
  }

}
