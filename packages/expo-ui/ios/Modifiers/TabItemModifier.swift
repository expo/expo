// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct TabItemModifier: ViewModifier, Record {
  // Both are optional so callers can provide just an icon, just a label, or
  // both. If neither is provided the tab still appears in the bar but with no
  // visual content — matches SwiftUI's behavior for `.tabItem { EmptyView() }`.
  @Field var label: String?
  @Field var systemImage: String?

  @ViewBuilder
  func body(content: Content) -> some View {
    content.tabItem {
      if let label, let systemImage {
        Label(label, systemImage: systemImage)
      } else if let label {
        Text(label)
      } else if let systemImage {
        Image(systemName: systemImage)
      }
    }
  }
}
