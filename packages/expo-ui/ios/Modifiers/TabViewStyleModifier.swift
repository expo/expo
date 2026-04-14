// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TabViewStyleType: String, Enumerable {
  case page
  case automatic
}

internal enum PageIndexDisplayMode: String, Enumerable {
  case automatic
  case always
  case never

  var asSwiftUI: PageTabViewStyle.IndexDisplayMode {
    switch self {
    case .automatic: .automatic
    case .always: .always
    case .never: .never
    }
  }
}

internal struct TabViewStyleModifier: ViewModifier, Record {
  // Currently exposes `.page` (swipeable pager) and `.automatic` (default
  // bottom-tab bar; pair with the `tabItem` modifier on each child).
  @Field var type: TabViewStyleType?
  @Field var indexDisplayMode: PageIndexDisplayMode?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch type ?? .page {
    case .page:
      content.tabViewStyle(.page(indexDisplayMode: (indexDisplayMode ?? .automatic).asSwiftUI))
    case .automatic:
      content.tabViewStyle(.automatic)
    }
  }
}
