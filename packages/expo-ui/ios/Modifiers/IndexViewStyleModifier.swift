// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum IndexViewStyleType: String, UIEnum {
  case page
}

internal enum PageIndexBackgroundDisplayMode: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func indexViewStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let type: IndexViewStyleType? = try p.value("type", nil)
  let backgroundDisplayMode: PageIndexBackgroundDisplayMode? = try p.value("backgroundDisplayMode", nil)
#if os(macOS)
  content
#else
  switch type ?? .page {
  case .page:
    content.indexViewStyle(.page(backgroundDisplayMode: (backgroundDisplayMode ?? .automatic).asSwiftUI))
  }
#endif
}
