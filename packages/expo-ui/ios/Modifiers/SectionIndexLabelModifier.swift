// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func sectionIndexLabelModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let label: String? = try p.value("label", nil)
  if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
    content.sectionIndexLabel(label)
#else
    content
#endif
  } else {
    content
  }
}
