// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum IndexViewStyleType: String, Enumerable {
  case page
}

internal enum PageIndexBackgroundDisplayMode: String, Enumerable {
  case automatic
  case always
  case never
  case interactive

#if !os(macOS)
  var asSwiftUI: PageIndexViewStyle.BackgroundDisplayMode {
    switch self {
    case .automatic: .automatic
    case .always: .always
    case .never: .never
    case .interactive: .interactive
    }
  }
#endif
}

internal struct IndexViewStyleModifier: ViewModifier, Record {
  @Field var type: IndexViewStyleType?
  @Field var backgroundDisplayMode: PageIndexBackgroundDisplayMode?

  @ViewBuilder
  func body(content: Content) -> some View {
#if os(macOS)
    content
#else
    switch type ?? .page {
    case .page:
      content.indexViewStyle(.page(backgroundDisplayMode: (backgroundDisplayMode ?? .automatic).asSwiftUI))
    }
#endif
  }
}
