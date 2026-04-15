// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TabViewStyleType: String, Enumerable {
  case page
  case automatic
  case sidebarAdaptable
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
  // `.page` (swipeable pager), `.automatic` (default bottom-tab bar; pair
  // with the `tabItem` modifier on each child), and (iOS 18+)
  // `.sidebarAdaptable` (sidebar on iPad/Mac, bottom bar on iPhone; requires
  // `<Tab>` children).
  @Field var type: TabViewStyleType?
  @Field var indexDisplayMode: PageIndexDisplayMode?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch type ?? .page {
    case .page:
      content.tabViewStyle(.page(indexDisplayMode: (indexDisplayMode ?? .automatic).asSwiftUI))
    case .automatic:
      content.tabViewStyle(.automatic)
    case .sidebarAdaptable:
      if #available(iOS 18.0, *) {
        content.tabViewStyle(.sidebarAdaptable)
      } else {
        content.tabViewStyle(.automatic)
      }
    }
  }
}
