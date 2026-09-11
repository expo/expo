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

#if !os(macOS)
  var asSwiftUI: PageTabViewStyle.IndexDisplayMode {
    switch self {
    case .automatic: .automatic
    case .always: .always
    case .never: .never
    }
  }
#endif
}

internal struct TabViewStyleModifier: ViewModifier, Record {
  @Field var type: TabViewStyleType?
  @Field var indexDisplayMode: PageIndexDisplayMode?

  @ViewBuilder
  func body(content: Content) -> some View {
    switch type ?? .page {
    case .page:
      // macOS has no paged `TabView`: `PageTabViewStyle` is unavailable there, so `.page`
      // resolves to the platform default.
#if os(macOS)
      content.tabViewStyle(.automatic)
#else
      content.tabViewStyle(.page(indexDisplayMode: (indexDisplayMode ?? .automatic).asSwiftUI))
#endif
    case .automatic:
      content.tabViewStyle(.automatic)
    case .sidebarAdaptable:
      if #available(iOS 18.0, macOS 15.0, tvOS 18.0, *) {
        content.tabViewStyle(.sidebarAdaptable)
      } else {
        content.tabViewStyle(.automatic)
      }
    }
  }
}
