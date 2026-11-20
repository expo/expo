// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TabViewStyleType: String, UIEnum {
  case page
  case automatic
  case sidebarAdaptable
}

internal enum PageIndexDisplayMode: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func tabViewStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let type: TabViewStyleType? = try p.value("type", nil)
  let indexDisplayMode: PageIndexDisplayMode? = try p.value("indexDisplayMode", nil)
  switch type ?? .page {
  case .page:
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
