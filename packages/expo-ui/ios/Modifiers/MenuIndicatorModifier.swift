// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func menuIndicatorModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let visibility: VisibilityOptions = try p.value("visibility", .automatic)
  // `menuIndicator(_:)` requires iOS 15.0 / tvOS 17.0.
  if #available(iOS 15.0, tvOS 17.0, *) {
    content.menuIndicator(visibility.toVisibility())
  } else {
    content
  }
}
